import { BN } from 'bn.js';
import { toHex, toBuff, toDecimals, toFixedLenHex, toHexNoPrefix } from '../../../../src/utils.js';
import protocol from '../../../../src/protocol/index.js';
import MerkleTree from 'fixed-merkle-tree';

const MystikoWithLoopMain = artifacts.require('MystikoWithLoopMain');
const Verifier = artifacts.require('Verifier');
const Hasher = artifacts.require('Hasher');

contract('MystikoWithLoopMain', (accounts) => {
  it('should set verifier information correctly', async () => {
    const loopContract = await MystikoWithLoopMain.deployed();
    const verifierContract = await Verifier.deployed();
    expect(await loopContract.getVerifierAddress.call()).to.equal(verifierContract.address);
  });

  it('should set hasher information correctly', async () => {
    const loopContract = await MystikoWithLoopMain.deployed();
    const hasherContract = await Hasher.deployed();
    expect(await loopContract.getHasherAddress.call()).to.equal(hasherContract.address);
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
      const { commitmentHash, privateNote } = protocol.commitment(pkVerify, pkEnc, amount);
      const loopContract = await MystikoWithLoopMain.deployed();
      const gasEstimated = await loopContract.deposit.estimateGas(
        amount,
        toFixedLenHex(commitmentHash),
        toHex(privateNote),
        { from: accounts[1], value: toHex(amount) },
      );
      depositTx = await loopContract.deposit(amount, toFixedLenHex(commitmentHash), toHex(privateNote), {
        from: accounts[1],
        gas: gasEstimated,
        value: toHex(amount),
      });
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
      const levels = await loopContract.getLevels.call();
      const tree = new MerkleTree(levels, [merkleTreeInsertEvent.args.leaf]);
      const root = new BN(tree.root());
      const isKnownRoot = await loopContract.isKnownRoot.call(toFixedLenHex(root));
      expect(isKnownRoot).to.equal(true);
    });
  });

  describe('Test withdraw operation', () => {
    let proof, publicSignals;
    it('should generate proof successfully', async () => {
      const depositEvent = depositTx.logs.find((e) => e['event'] === 'Deposit');
      const merkleTreeInsertEvent = depositTx.logs.find((e) => e['event'] === 'MerkleTreeInsert');
      const amount = BigInt(depositEvent.args.amount.toString());
      const commitmentHash = BigInt(depositEvent.args.commitmentHash);
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
        'build/circuits/withdraw.wasm',
        'build/circuits/withdraw.zkey',
      );
      proof = fullProof.proof;
      publicSignals = fullProof.publicSignals;
      expect(proof['pi_a'].length).to.be.gte(2);
      expect(proof['pi_b'].length).to.be.gte(2);
      expect(proof['pi_b'][0].length).to.equal(2);
      expect(proof['pi_b'][1].length).to.equal(2);
      expect(proof['pi_c'].length).to.be.gte(2);
      expect(publicSignals.length).to.equal(3);
      const result = await protocol.zkVerify(proof, publicSignals, 'build/circuits/withdraw.vkey.json');
      expect(result).to.equal(true);
    });

    it('should withdraw successfully', async () => {
      const loopContract = await MystikoWithLoopMain.deployed();
      const verifierContract = await Verifier.deployed();
      const proofA = [new BN(proof.pi_a[0]), new BN(proof.pi_a[1])];
      const proofB = [
        [new BN(proof.pi_b[0][1]), new BN(proof.pi_b[0][0])],
        [new BN(proof.pi_b[1][1]), new BN(proof.pi_b[1][0])],
      ];
      const proofC = [new BN(proof.pi_c[0]), new BN(proof.pi_c[1])];
      const rootHash = new BN(publicSignals[0]);
      const serialNumber = new BN(publicSignals[1]);
      const amount = new BN(toDecimals(1, 16).toString());
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
      const isSpent = await loopContract.isSpent(serialNumber);
      expect(isSpent).to.equal(true);
    });
  });
});
