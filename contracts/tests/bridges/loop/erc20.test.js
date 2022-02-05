import { BN } from 'bn.js';
import { toHex, toBuff, toDecimals, toFixedLenHex, toHexNoPrefix } from '../../../../src/utils.js';
import * as protocol from '../../../../src/protocol';
import { MerkleTree } from '../../../../src/lib/merkleTree.js';

const MystikoWithLoopERC20 = artifacts.require('MystikoWithLoopERC20');
const TestToken = artifacts.require('TestToken');
const Verifier = artifacts.require('WithdrawVerifier');
const Hasher2 = artifacts.require('Hasher2');

contract('MystikoWithLoopERC20', (accounts) => {
  describe('Test basic read operations', () => {
    it('should set token correctly information correctly', async () => {
      const tokenContract = await TestToken.deployed();
      const loopContract = await MystikoWithLoopERC20.deployed();
      expect(await loopContract.asset()).to.equal(tokenContract.address);
      expect(await loopContract.assetName()).to.equal(await tokenContract.name());
      expect(await loopContract.assetSymbol()).to.equal(await tokenContract.symbol());
      const actualDecimals = (await loopContract.assetDecimals()).toString();
      const expectedDecimals = (await tokenContract.decimals()).toString();
      expect(actualDecimals).to.equal(expectedDecimals);
      const bridgeType = await loopContract.bridgeType();
      const assetType = await loopContract.assetType();
      expect(bridgeType).to.equal('loop');
      expect(assetType).to.equal('erc20');
    });

    it('should set verifier information correctly', async () => {
      const loopContract = await MystikoWithLoopERC20.deployed();
      const verifierContract = await Verifier.deployed();
      expect(await loopContract.getVerifierAddress()).to.equal(verifierContract.address);
    });

    it('should set hasher information correctly', async () => {
      const loopContract = await MystikoWithLoopERC20.deployed();
      const hasher2Contract = await Hasher2.deployed();
      expect(await loopContract.getHasherAddress()).to.equal(hasher2Contract.address);
    });

    it('should have enough tokens in account 0', async () => {
      const tokenContract = await TestToken.deployed();
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
      const loopContract = await MystikoWithLoopERC20.deployed();
      const tokenContract = await TestToken.deployed();
      await tokenContract.approve(loopContract.address, amount, { from: accounts[1] });
      const allowance = await tokenContract.allowance(accounts[1], loopContract.address);
      expect(allowance.toString()).to.equal(amount.toString());
      const gasEstimated = await loopContract.deposit.estimateGas(
        amount,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS, protocol.RANDOM_SK_SIZE),
        toHex(privateNote),
        { from: accounts[1] },
      );
      depositTx = await loopContract.deposit(
        amount,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS, protocol.RANDOM_SK_SIZE),
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
      const levels = await loopContract.getLevels();
      const tree = new MerkleTree(parseInt(levels), [
        new BN(toHexNoPrefix(merkleTreeInsertEvent.args.leaf), 16),
      ]);
      const root = new BN(tree.root());
      const isKnownRoot = await loopContract.isKnownRoot(toFixedLenHex(root));
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
        'dist/circom/dev/Withdraw.wasm',
        'dist/circom/dev/Withdraw.zkey',
      );
      proof = fullProof.proof;
      publicSignals = fullProof.publicSignals;
      expect(proof['pi_a'].length).to.be.gte(2);
      expect(proof['pi_b'].length).to.be.gte(2);
      expect(proof['pi_b'][0].length).to.equal(2);
      expect(proof['pi_b'][1].length).to.equal(2);
      expect(proof['pi_c'].length).to.be.gte(2);
      expect(publicSignals.length).to.equal(3);
      const result = await protocol.zkVerify(proof, publicSignals, 'dist/circom/dev/Withdraw.vkey.json');
      expect(result).to.equal(true);
    });

    it('should withdraw successfully', async () => {
      const loopContract = await MystikoWithLoopERC20.deployed();
      const tokenContract = await TestToken.deployed();
      const verifierContract = await Verifier.deployed();
      const proofA = [new BN(proof.pi_a[0]), new BN(proof.pi_a[1])];
      const proofB = [
        [new BN(proof.pi_b[0][1]), new BN(proof.pi_b[0][0])],
        [new BN(proof.pi_b[1][1]), new BN(proof.pi_b[1][0])],
      ];
      const proofC = [new BN(proof.pi_c[0]), new BN(proof.pi_c[1])];
      const rootHash = new BN(publicSignals[0]);
      const serialNumber = new BN(publicSignals[1]);
      const amount = new BN(toDecimals(1000, 18).toString());
      const result = await verifierContract.verifyProof(proofA, proofB, proofC, [
        rootHash,
        serialNumber,
        amount,
      ]);
      expect(result).to.equal(true);
      const recipient = accounts[2];
      const gasEstimated = await loopContract.withdraw.estimateGas(
        proofA,
        proofB,
        proofC,
        rootHash,
        serialNumber,
        amount,
        recipient,
        { from: accounts[1] },
      );
      await loopContract.withdraw(proofA, proofB, proofC, rootHash, serialNumber, amount, recipient, {
        from: accounts[1],
        gas: gasEstimated,
      });
      const balanceOfAccount3 = await tokenContract.balanceOf(accounts[2]);
      expect(balanceOfAccount3.toString()).to.equal(amount.toString());
      const isSpent = await loopContract.isSpent(serialNumber);
      expect(isSpent).to.equal(true);
    });
  });
});
