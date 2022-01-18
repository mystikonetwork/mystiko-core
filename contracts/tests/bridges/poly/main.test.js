import BN from 'bn.js';
import { toHex, toBuff, toDecimals, toFixedLenHex, toHexNoPrefix } from '../../../../src/utils.js';
import protocol from '../../../../src/protocol/index.js';
import MerkleTree from 'fixed-merkle-tree';

const MystikoWithPolyMain = artifacts.require('MystikoWithPolyMain');
const CrossChainManager = artifacts.require('PolyCrossChainManagerMock');
const Verifier = artifacts.require('Verifier');
const Hasher = artifacts.require('Hasher');

contract('MystikoWithPolyMain', (accounts) => {

  let mystikoWithPolySourceMain;
  let mystikoWithPolyDestinationMain;
  let crossChainManager;
  let hasher;
  let verifier;

  before(async () => {
    const { MERKLE_TREE_HEIGHT } = process.env;
    const { SOURCE_CHAIN_ID } = process.env;
    const { DESTINATION_CHAIN_ID } = process.env;

    verifier = await Verifier.deployed();
    hasher = await Hasher.deployed();
    crossChainManager = await CrossChainManager.new();

    mystikoWithPolySourceMain = await MystikoWithPolyMain.new(
      crossChainManager.address,
      DESTINATION_CHAIN_ID,
      verifier.address,
      hasher.address,
      MERKLE_TREE_HEIGHT,
    );

    mystikoWithPolyDestinationMain = await MystikoWithPolyMain.new(
      crossChainManager.address,
      SOURCE_CHAIN_ID,
      verifier.address,
      hasher.address,
      MERKLE_TREE_HEIGHT,
    );

    await crossChainManager.setChainPair(
      SOURCE_CHAIN_ID,
      mystikoWithPolySourceMain.address,
      DESTINATION_CHAIN_ID,
      mystikoWithPolyDestinationMain.address,
    );

    await mystikoWithPolySourceMain.setPeerContractAddress(
      mystikoWithPolyDestinationMain.address,
    );

    await mystikoWithPolyDestinationMain.setPeerContractAddress(
      mystikoWithPolySourceMain.address,
    );

    await web3.eth.sendTransaction({
      from: accounts[1],
      to: mystikoWithPolyDestinationMain.address,
      value: toDecimals(1, 16),
    });
  });

  it('should set type correctly', async () => {
    const bridgeTypeSource = await mystikoWithPolySourceMain.bridgeType();
    const assetTypeSource = await mystikoWithPolySourceMain.assetType();
    expect(bridgeTypeSource).to.equal('poly');
    expect(assetTypeSource).to.equal('main');

    const bridgeTypeDestination = await mystikoWithPolyDestinationMain.bridgeType();
    const assetTypeDestination = await mystikoWithPolyDestinationMain.assetType();
    expect(bridgeTypeDestination).to.equal('poly');
    expect(assetTypeDestination).to.equal('main');
  });

  it('should set verifier information correctly', async () => {
    expect(await mystikoWithPolySourceMain.getVerifierAddress()).to.equal(verifier.address);
    expect(await mystikoWithPolyDestinationMain.getVerifierAddress()).to.equal(verifier.address);
  });

  it('should set hasher information correctly', async () => {
    expect(await mystikoWithPolySourceMain.getHasherAddress()).to.equal(hasher.address);
    expect(await mystikoWithPolyDestinationMain.getHasherAddress()).to.equal(hasher.address);
  });

  const rawSkVerify = protocol.randomBytes(protocol.VERIFY_SK_SIZE);
  const rawSkEnc = protocol.randomBytes(protocol.ENCRYPT_SK_SIZE);
  const skVerify = protocol.secretKeyForVerification(rawSkVerify);
  const skEnc = protocol.secretKeyForEncryption(rawSkEnc);
  const pkVerify = protocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = protocol.publicKeyForEncryption(rawSkEnc);
  let depositTx;

  describe('Test deposit operation', () => {
    it('should deposit successfully', async () => {
      const amount = toDecimals(1, 16);
      const { commitmentHash, privateNote, k, randomS } = await protocol.commitment(pkVerify, pkEnc, amount);

      const gasEstimated = await mystikoWithPolySourceMain.deposit.estimateGas(
        amount,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS),
        toHex(privateNote),
        { from: accounts[1], value: toHex(amount) },
      );

      depositTx = await mystikoWithPolySourceMain.deposit(
        amount,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS),
        toHex(privateNote),
        {
          from: accounts[1],
          gas: gasEstimated,
          value: toHex(amount),
        },
      );
      const depositEvent = depositTx.logs.find((e) => e['event'] === 'Deposit');
      expect(depositEvent).to.not.equal(undefined);
      expect(depositEvent.args.amount.toString()).to.equal(amount.toString());
      expect(depositEvent.args.commitmentHash).to.equal(toFixedLenHex(commitmentHash));
      expect(depositEvent.args.encryptedNote).to.equal(toHex(privateNote));
      const merkleTreeInsertEvent = depositTx.logs.find((e) => e['event'] === 'MerkleTreeInsert');
      expect(merkleTreeInsertEvent).to.not.equal(undefined);
      expect(merkleTreeInsertEvent.args.amount.toString()).to.equal(amount.toString());
      expect(merkleTreeInsertEvent.args.leaf).to.equal(toFixedLenHex(commitmentHash));
      expect(merkleTreeInsertEvent.args.leafIndex.eq(new BN(0))).to.equal(true);
      const levels = await mystikoWithPolyDestinationMain.getLevels();
      const tree = new MerkleTree(levels, [merkleTreeInsertEvent.args.leaf]);
      const root = new BN(tree.root());
      const isKnownRoot = await mystikoWithPolyDestinationMain.isKnownRoot(toFixedLenHex(root));
      expect(isKnownRoot).to.equal(true);
    });
  });


  describe('Test withdraw operation', () => {
    let proof, publicSignals;
    it('should generate proof successfully', async () => {
      const depositEvent = depositTx.logs.find((e) => e['event'] === 'Deposit');
      const merkleTreeInsertEvent = depositTx.logs.find((e) => e['event'] === 'MerkleTreeInsert');
      const amount = new BN(depositEvent.args.amount.toString());
      const commitmentHash = new BN(toHexNoPrefix(depositEvent.args.commitmentHash), 16);
      const privateNote = toBuff(toHexNoPrefix(depositEvent.args.encryptedNote));
      const treeLeaves = [commitmentHash];
      const treeIndex = Number(merkleTreeInsertEvent.args.leafIndex);
      const fullProof = await protocol.zkProve(
        pkVerify,
        skVerify,
        pkEnc,
        skEnc,
        amount,
        commitmentHash,
        privateNote,
        treeLeaves,
        treeIndex,
        'dist/circom/dev/withdraw.wasm',
        'dist/circom/dev/withdraw.zkey',
      );
      proof = fullProof.proof;
      publicSignals = fullProof.publicSignals;
      expect(proof['pi_a'].length).to.be.gte(2);
      expect(proof['pi_b'].length).to.be.gte(2);
      expect(proof['pi_b'][0].length).to.equal(2);
      expect(proof['pi_b'][1].length).to.equal(2);
      expect(proof['pi_c'].length).to.be.gte(2);
      expect(publicSignals.length).to.equal(3);
      const result = await protocol.zkVerify(proof, publicSignals, 'dist/circom/dev/withdraw.vkey.json');
      expect(result).to.equal(true);
    });

    it('should withdraw successfully', async () => {
      const proofA = [new BN(proof.pi_a[0]), new BN(proof.pi_a[1])];
      const proofB = [
        [new BN(proof.pi_b[0][1]), new BN(proof.pi_b[0][0])],
        [new BN(proof.pi_b[1][1]), new BN(proof.pi_b[1][0])],
      ];
      const proofC = [new BN(proof.pi_c[0]), new BN(proof.pi_c[1])];
      const rootHash = new BN(publicSignals[0]);
      const serialNumber = new BN(publicSignals[1]);
      const amount = new BN(toDecimals(1, 16).toString());
      const result = await verifier.verifyProof(proofA, proofB, proofC, [
        rootHash,
        serialNumber,
        amount,
      ]);
      expect(result).to.equal(true);
      const recipient = accounts[2];
      const gasEstimated = await mystikoWithPolyDestinationMain.withdraw.estimateGas(
        proofA,
        proofB,
        proofC,
        rootHash,
        serialNumber,
        amount,
        recipient,
        { from: accounts[1] },
      );
      await mystikoWithPolyDestinationMain.withdraw(proofA, proofB, proofC, rootHash, serialNumber, amount, recipient, {
        from: accounts[1],
        gas: gasEstimated,
      });
      const isSpent = await mystikoWithPolyDestinationMain.isSpent(serialNumber);
      expect(isSpent).to.equal(true);
    });
  });
});
