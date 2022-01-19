import BN from 'bn.js';
import { toHex, toBuff, toDecimals, toFixedLenHex, toHexNoPrefix } from '../../../../src/utils.js';
import protocol from '../../../../src/protocol/index.js';
import MerkleTree from 'fixed-merkle-tree';

const MystikoWithPolyERC20 = artifacts.require('MystikoWithPolyERC20');
const CrossChainManager = artifacts.require('PolyCrossChainManagerMock');
const Verifier = artifacts.require('Verifier');
const Hasher = artifacts.require('Hasher');
const TestToken = artifacts.require('TestToken');

contract('MystikoWithPolyERC20', (accounts) => {
  let mystikoWithPolySourceERC20;
  let mystikoWithPolyDestinationERC20;
  let crossChainManager;
  let hasher;
  let verifier;
  let testToken;

  before(async () => {
    const { MERKLE_TREE_HEIGHT } = process.env;
    const { SOURCE_CHAIN_ID } = process.env;
    const { DESTINATION_CHAIN_ID } = process.env;

    testToken = await TestToken.deployed();
    verifier = await Verifier.deployed();
    hasher = await Hasher.deployed();

    crossChainManager = await CrossChainManager.new();

    mystikoWithPolySourceERC20 = await MystikoWithPolyERC20.new(
      crossChainManager.address,
      DESTINATION_CHAIN_ID,
      verifier.address,
      testToken.address,
      hasher.address,
      MERKLE_TREE_HEIGHT,
    );

    mystikoWithPolyDestinationERC20 = await MystikoWithPolyERC20.new(
      crossChainManager.address,
      SOURCE_CHAIN_ID,
      verifier.address,
      testToken.address,
      hasher.address,
      MERKLE_TREE_HEIGHT,
    );

    await crossChainManager.setChainPair(
      SOURCE_CHAIN_ID,
      mystikoWithPolySourceERC20.address,
      DESTINATION_CHAIN_ID,
      mystikoWithPolyDestinationERC20.address,
    );

    await mystikoWithPolySourceERC20.setPeerContractAddress(mystikoWithPolyDestinationERC20.address);
    await mystikoWithPolyDestinationERC20.setPeerContractAddress(mystikoWithPolySourceERC20.address);
  });

  describe('Test basic read operations', () => {
    it('should set token correctly information correctly', async () => {
      expect(await mystikoWithPolySourceERC20.asset()).to.equal(testToken.address);
      expect(await mystikoWithPolySourceERC20.assetName()).to.equal(await testToken.name());
      expect(await mystikoWithPolySourceERC20.assetSymbol()).to.equal(await testToken.symbol());
      const actualDecimals = (await mystikoWithPolySourceERC20.assetDecimals()).toString();
      const expectedDecimals = (await testToken.decimals()).toString();
      expect(actualDecimals).to.equal(expectedDecimals);

      const bridgeTypeSource = await mystikoWithPolySourceERC20.bridgeType();
      const assetTypeSource = await mystikoWithPolySourceERC20.assetType();
      expect(bridgeTypeSource).to.equal('poly');
      expect(assetTypeSource).to.equal('erc20');

      const bridgeTypeDestination = await mystikoWithPolyDestinationERC20.bridgeType();
      const assetTypeDestination = await mystikoWithPolyDestinationERC20.assetType();
      expect(bridgeTypeDestination).to.equal('poly');
      expect(assetTypeDestination).to.equal('erc20');
    });

    it('should set verifier information correctly', async () => {
      expect(await mystikoWithPolySourceERC20.getVerifierAddress()).to.equal(verifier.address);
      expect(await mystikoWithPolyDestinationERC20.getVerifierAddress()).to.equal(verifier.address);
    });

    it('should set hasher information correctly', async () => {
      expect(await mystikoWithPolySourceERC20.getHasherAddress()).to.equal(hasher.address);
      expect(await mystikoWithPolyDestinationERC20.getHasherAddress()).to.equal(hasher.address);
    });

    it('should have enough tokens in account 0', async () => {
      const tokenContract = await TestToken.deployed();
      console.log(tokenContract.address);
      const balanceOfAccount0 = await tokenContract.balanceOf(accounts[0]);
      expect(balanceOfAccount0.toString()).to.equal(toDecimals(1000000000, 18).toString());
    });
  });

  const rawSkVerify = protocol.randomBytes(protocol.VERIFY_SK_SIZE);
  const rawSkEnc = protocol.randomBytes(protocol.ENCRYPT_SK_SIZE);
  const skVerify = protocol.secretKeyForVerification(rawSkVerify);
  const skEnc = protocol.secretKeyForEncryption(rawSkEnc);
  const pkVerify = protocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = protocol.publicKeyForEncryption(rawSkEnc);
  let depositTx;

  describe('Test deposit operation', () => {
    it('should transfer token to account 1 correctly', async () => {
      const tokenContract = await TestToken.deployed();
      await tokenContract.transfer(accounts[1], toDecimals(1000, 18), { from: accounts[0] });
      const balanceOfAccount1 = await tokenContract.balanceOf(accounts[1]);
      expect(balanceOfAccount1.toString()).to.equal(toDecimals(1000, 18).toString());
    });

    it('should deposit successfully', async () => {
      const amount = toDecimals(1000, 18);
      const { commitmentHash, privateNote, k, randomS } = await protocol.commitment(pkVerify, pkEnc, amount);

      await testToken.approve(mystikoWithPolySourceERC20.address, amount, { from: accounts[1] });
      const allowance = await testToken.allowance(accounts[1], mystikoWithPolySourceERC20.address);
      expect(allowance.toString()).to.equal(amount.toString());

      const gasEstimated = await mystikoWithPolySourceERC20.deposit.estimateGas(
        amount,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS),
        toHex(privateNote),
        { from: accounts[1] },
      );

      depositTx = await mystikoWithPolySourceERC20.deposit(
        amount,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS),
        toHex(privateNote),
        {
          from: accounts[1],
          gas: gasEstimated,
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
      const levels = await mystikoWithPolyDestinationERC20.getLevels();
      const tree = new MerkleTree(levels, [merkleTreeInsertEvent.args.leaf]);
      const root = new BN(tree.root());
      const isKnownRoot = await mystikoWithPolyDestinationERC20.isKnownRoot(toFixedLenHex(root));
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
      const amount = new BN(toDecimals(1000, 18).toString());
      await testToken.transfer(mystikoWithPolyDestinationERC20.address, amount, { from: accounts[0] });

      const proofA = [new BN(proof.pi_a[0]), new BN(proof.pi_a[1])];
      const proofB = [
        [new BN(proof.pi_b[0][1]), new BN(proof.pi_b[0][0])],
        [new BN(proof.pi_b[1][1]), new BN(proof.pi_b[1][0])],
      ];
      const proofC = [new BN(proof.pi_c[0]), new BN(proof.pi_c[1])];
      const rootHash = new BN(publicSignals[0]);
      const serialNumber = new BN(publicSignals[1]);
      const result = await verifier.verifyProof(proofA, proofB, proofC, [rootHash, serialNumber, amount]);
      expect(result).to.equal(true);
      const recipient = accounts[2];
      const gasEstimated = await mystikoWithPolyDestinationERC20.withdraw.estimateGas(
        proofA,
        proofB,
        proofC,
        rootHash,
        serialNumber,
        amount,
        recipient,
        { from: accounts[1] },
      );
      await mystikoWithPolyDestinationERC20.withdraw(
        proofA,
        proofB,
        proofC,
        rootHash,
        serialNumber,
        amount,
        recipient,
        {
          from: accounts[1],
          gas: gasEstimated,
        },
      );
      const isSpent = await mystikoWithPolyDestinationERC20.isSpent(serialNumber);
      expect(isSpent).to.equal(true);
    });
  });
});
