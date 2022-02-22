import { toHex, toBuff, toDecimals, toFixedLenHex, toHexNoPrefix, toBN } from '@mystiko/client/src/utils.js';
import * as protocol from '@mystiko/client/src/protocol';
import { MerkleTree } from '@mystiko/client/src/lib/merkleTree.js';

const MystikoWithCelerMain = artifacts.require('MystikoWithCelerMain');
const MystikoWithCelerERC20 = artifacts.require('MystikoWithCelerERC20');
const RelayProxy = artifacts.require('CelerMessageBusMock');
const Verifier = artifacts.require('WithdrawVerifier');
const Hasher2 = artifacts.require('Hasher2');
const TestToken = artifacts.require('TestToken');

contract('MystikoWithCelerMainToERC20', (accounts) => {
  let mystikoCoreSourceMain;
  let mystikoCoreDestinationERC20;
  let relayProxy;
  let hasher2;
  let verifier;
  let testToken;
  let amount = toBN(toDecimals(1, 16).toString());

  before(async () => {
    const { MERKLE_TREE_HEIGHT } = process.env;
    const SOURCE_CHAIN_ID = 1100;
    const DESTINATION_CHAIN_ID = 1200;

    testToken = await TestToken.deployed();
    verifier = await Verifier.deployed();
    hasher2 = await Hasher2.deployed();
    relayProxy = await RelayProxy.new();

    mystikoCoreSourceMain = await MystikoWithCelerMain.new(
      relayProxy.address,
      DESTINATION_CHAIN_ID,
      verifier.address,
      hasher2.address,
      MERKLE_TREE_HEIGHT,
    );

    mystikoCoreDestinationERC20 = await MystikoWithCelerERC20.new(
      relayProxy.address,
      SOURCE_CHAIN_ID,
      verifier.address,
      testToken.address,
      hasher2.address,
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
      expect(bridgeTypeSource).to.equal('celer');
      expect(assetTypeSource).to.equal('main');

      const bridgeTypeDestination = await mystikoCoreDestinationERC20.bridgeType();
      const assetTypeDestination = await mystikoCoreDestinationERC20.assetType();
      expect(bridgeTypeDestination).to.equal('celer');
      expect(assetTypeDestination).to.equal('erc20');
    });

    it('should set verifier information correctly', async () => {
      expect(await mystikoCoreSourceMain.getVerifierAddress()).to.equal(verifier.address);
      expect(await mystikoCoreDestinationERC20.getVerifierAddress()).to.equal(verifier.address);
    });

    it('should set hasher information correctly', async () => {
      expect(await mystikoCoreSourceMain.getHasherAddress()).to.equal(hasher2.address);
      expect(await mystikoCoreDestinationERC20.getHasherAddress()).to.equal(hasher2.address);
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
        toFixedLenHex(randomS, protocol.RANDOM_SK_SIZE),
        toHex(privateNote),
        { from: accounts[1], value: toHex(amount) },
      );

      let balance = await web3.eth.getBalance(mystikoCoreSourceMain.address);
      expect(balance.toString()).to.equal('0');
      balance = await web3.eth.getBalance(relayProxy.address);
      expect(balance.toString()).to.equal('0');
      balance = await web3.eth.getBalance(mystikoCoreDestinationERC20.address);
      expect(balance.toString()).to.equal('0');

      depositTx = await mystikoCoreSourceMain.deposit(
        amount,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS, protocol.RANDOM_SK_SIZE),
        toHex(privateNote),
        {
          from: accounts[1],
          gas: gasEstimated,
          value: toHex(amount),
        },
      );

      balance = await web3.eth.getBalance(mystikoCoreSourceMain.address);
      expect(balance.toString()).to.equal(amount.toString());
      balance = await web3.eth.getBalance(relayProxy.address);
      expect(balance.toString()).to.equal('0');
      balance = await web3.eth.getBalance(mystikoCoreDestinationERC20.address);
      expect(balance.toString()).to.equal('0');

      const finalBalanceOfAccount1 = await web3.eth.getBalance(accounts[1]);
      const differenceBalanceOfAccount1 = toBN(initialBalanceOfAccount1).sub(toBN(finalBalanceOfAccount1));
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
      expect(merkleTreeInsertEvent.args.leafIndex.eq(toBN(0))).to.equal(true);
      const levels = await mystikoCoreDestinationERC20.getLevels();
      const tree = new MerkleTree(parseInt(levels), [
        toBN(toHexNoPrefix(merkleTreeInsertEvent.args.leaf), 16),
      ]);
      const root = toBN(tree.root());
      const isKnownRoot = await mystikoCoreDestinationERC20.isKnownRoot(toFixedLenHex(root));
      expect(isKnownRoot).to.equal(true);
    });
  });

  describe('Test withdraw operation', () => {
    let proof, publicSignals;
    it('should generate proof successfully', async () => {
      const depositEvent = depositTx.logs.find((e) => e['event'] === 'Deposit');
      const merkleTreeInsertEvent = depositTx.logs.find((e) => e['event'] === 'MerkleTreeInsert');
      const dAmount = toBN(depositEvent.args.amount.toString());
      const commitmentHash = toBN(toHexNoPrefix(depositEvent.args.commitmentHash), 16);
      const privateNote = toBuff(toHexNoPrefix(depositEvent.args.encryptedNote));
      const treeLeaves = [commitmentHash];
      const treeIndex = Number(merkleTreeInsertEvent.args.leafIndex);
      const fullProof = await protocol.zkProve(
        pkVerify,
        skVerify,
        pkEnc,
        skEnc,
        dAmount,
        accounts[2],
        commitmentHash,
        privateNote,
        treeLeaves,
        treeIndex,
        'node_modules/@mystiko/circuits/dist/circom/dev/Withdraw.wasm.gz',
        'node_modules/@mystiko/circuits/dist/circom/dev/Withdraw.zkey.gz',
      );
      proof = fullProof.proof;
      publicSignals = fullProof.publicSignals;
      expect(proof['pi_a'].length).to.be.gte(2);
      expect(proof['pi_b'].length).to.be.gte(2);
      expect(proof['pi_b'][0].length).to.equal(2);
      expect(proof['pi_b'][1].length).to.equal(2);
      expect(proof['pi_c'].length).to.be.gte(2);
      expect(publicSignals.length).to.equal(4);
      const result = await protocol.zkVerify(
        proof,
        publicSignals,
        'node_modules/@mystiko/circuits/dist/circom/dev/Withdraw.vkey.json.gz',
      );
      expect(result).to.equal(true);
    });

    it('should withdraw successfully', async () => {
      const recipient = accounts[2];
      await testToken.transfer(mystikoCoreDestinationERC20.address, amount.toString(), {
        from: accounts[0],
      });

      const proofA = [toBN(proof.pi_a[0]), toBN(proof.pi_a[1])];
      const proofB = [
        [toBN(proof.pi_b[0][1]), toBN(proof.pi_b[0][0])],
        [toBN(proof.pi_b[1][1]), toBN(proof.pi_b[1][0])],
      ];
      const proofC = [toBN(proof.pi_c[0]), toBN(proof.pi_c[1])];
      const rootHash = toBN(publicSignals[0]);
      const serialNumber = toBN(publicSignals[1]);
      const result = await verifier.verifyProof(proofA, proofB, proofC, [
        rootHash,
        serialNumber,
        amount,
        recipient,
      ]);
      expect(result).to.equal(true);
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
      const differenceBalanceOfAccount2 = toBN(finalBalanceOfAccount2).sub(toBN(initialBalanceOfAccount2));
      expect(differenceBalanceOfAccount2.toString()).to.equal(amount.toString());
    });
  });
});
