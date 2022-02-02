import BN from 'bn.js';
import { toHex, toBuff, toDecimals, toFixedLenHex, toHexNoPrefix } from '../../../../src/utils.js';
import * as protocol from '../../../../src/protocol';
import { MerkleTree } from '../../../../src/lib/merkleTree.js';

const MystikoWithPolyMain = artifacts.require('MystikoWithPolyMain');
const MystikoWithPolyERC20 = artifacts.require('MystikoWithPolyERC20');
const RelayProxy = artifacts.require('PolyCrossChainManagerMock');
const Verifier = artifacts.require('Verifier');
const Hasher = artifacts.require('Hasher');
const TestToken = artifacts.require('TestToken');

contract('MystikoWithPolyERC20ToMain', (accounts) => {
  let mystikoCoreSourceMain;
  let mystikoCoreDestinationERC20;
  let relayProxy;
  let hasher;
  let verifier;
  let testToken;
  let amount = new BN(toDecimals(1, 16).toString());

  before(async () => {
    const { MERKLE_TREE_HEIGHT } = process.env;
    const SOURCE_CHAIN_ID = 1100;
    const DESTINATION_CHAIN_ID = 1200;

    testToken = await TestToken.deployed();
    verifier = await Verifier.deployed();
    hasher = await Hasher.deployed();
    relayProxy = await RelayProxy.new();

    mystikoCoreSourceMain = await MystikoWithPolyMain.new(
      relayProxy.address,
      DESTINATION_CHAIN_ID,
      verifier.address,
      hasher.address,
      MERKLE_TREE_HEIGHT,
    );

    mystikoCoreDestinationERC20 = await MystikoWithPolyERC20.new(
      relayProxy.address,
      SOURCE_CHAIN_ID,
      verifier.address,
      testToken.address,
      hasher.address,
      MERKLE_TREE_HEIGHT,
    );

    await relayProxy.setChainPair(
      SOURCE_CHAIN_ID,
      mystikoCoreSourceMain.address,
      DESTINATION_CHAIN_ID,
      mystikoCoreDestinationERC20.address,
    );

    await mystikoCoreSourceMain.setPeerContractAddress(mystikoCoreDestinationERC20.address);
    await mystikoCoreDestinationERC20.setPeerContractAddress(mystikoCoreSourceMain.address);
  });

  describe('Test basic read operations', () => {
    it('should set token correctly information correctly', async () => {
      const bridgeTypeSource = await mystikoCoreSourceMain.bridgeType();
      const assetTypeSource = await mystikoCoreSourceMain.assetType();
      expect(bridgeTypeSource).to.equal('poly');
      expect(assetTypeSource).to.equal('main');

      const bridgeTypeDestination = await mystikoCoreDestinationERC20.bridgeType();
      const assetTypeDestination = await mystikoCoreDestinationERC20.assetType();
      expect(bridgeTypeDestination).to.equal('poly');
      expect(assetTypeDestination).to.equal('erc20');
    });

    it('should set verifier information correctly', async () => {
      expect(await mystikoCoreSourceMain.getVerifierAddress()).to.equal(verifier.address);
      expect(await mystikoCoreDestinationERC20.getVerifierAddress()).to.equal(verifier.address);
    });

    it('should set hasher information correctly', async () => {
      expect(await mystikoCoreSourceMain.getHasherAddress()).to.equal(hasher.address);
      expect(await mystikoCoreDestinationERC20.getHasherAddress()).to.equal(hasher.address);
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
    it('should deposit successfully', async () => {
      const { commitmentHash, privateNote, k, randomS } = await protocol.commitment(pkVerify, pkEnc, amount);
      const initialBalanceOfAccount1 = await web3.eth.getBalance(accounts[1]);
      const gasEstimated = await mystikoCoreSourceMain.deposit.estimateGas(
        amount,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS),
        toHex(privateNote),
        { from: accounts[1], value: toHex(amount) },
      );

      depositTx = await mystikoCoreSourceMain.deposit(
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

      const finalBalanceOfAccount1 = await web3.eth.getBalance(accounts[1]);
      const differenceBalanceOfAccount1 = new BN(initialBalanceOfAccount1).sub(
        new BN(finalBalanceOfAccount1),
      );
      expect(Number(differenceBalanceOfAccount1)).to.be.above(Number(amount));
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
      const levels = await mystikoCoreDestinationERC20.getLevels();
      const tree = new MerkleTree(parseInt(levels), [
        new BN(toHexNoPrefix(merkleTreeInsertEvent.args.leaf), 16),
      ]);
      const root = new BN(tree.root());
      const isKnownRoot = await mystikoCoreDestinationERC20.isKnownRoot(toFixedLenHex(root));
      expect(isKnownRoot).to.equal(true);
    });
  });

  describe('Test withdraw operation', () => {
    let proof, publicSignals;
    it('should generate proof successfully', async () => {
      const depositEvent = depositTx.logs.find((e) => e['event'] === 'Deposit');
      const merkleTreeInsertEvent = depositTx.logs.find((e) => e['event'] === 'MerkleTreeInsert');
      const dAmount = new BN(depositEvent.args.amount.toString());
      const commitmentHash = new BN(toHexNoPrefix(depositEvent.args.commitmentHash), 16);
      const privateNote = toBuff(toHexNoPrefix(depositEvent.args.encryptedNote));
      const treeLeaves = [commitmentHash];
      const treeIndex = Number(merkleTreeInsertEvent.args.leafIndex);
      const fullProof = await protocol.zkProve(
        pkVerify,
        skVerify,
        pkEnc,
        skEnc,
        dAmount,
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
      await testToken.transfer(mystikoCoreDestinationERC20.address, amount.toString(), {
        from: accounts[0],
      });

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
      const initialBalanceOfAccount2 = await testToken.balanceOf(accounts[2]);
      const gasEstimated = await mystikoCoreDestinationERC20.withdraw.estimateGas(
        proofA,
        proofB,
        proofC,
        rootHash,
        serialNumber,
        amount,
        recipient,
        { from: accounts[1] },
      );
      await mystikoCoreDestinationERC20.withdraw(
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
      const isSpent = await mystikoCoreDestinationERC20.isSpent(serialNumber);
      expect(isSpent).to.equal(true);
      const finalBalanceOfAccount2 = await testToken.balanceOf(accounts[2]);
      const differenceBalanceOfAccount2 = new BN(finalBalanceOfAccount2).sub(
        new BN(initialBalanceOfAccount2),
      );
      expect(differenceBalanceOfAccount2.toString()).to.equal(amount.toString());
    });
  });
});
