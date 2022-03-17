import { MerkleTree, v1Protocol } from '@mystiko/protocol';
import { toHex, toBuff, toDecimals, toFixedLenHex, toHexNoPrefix, toBN } from '@mystiko/utils';

const MystikoWithLoopMain = artifacts.require('MystikoWithLoopMain');
const Verifier = artifacts.require('WithdrawVerifier');
const Hasher2 = artifacts.require('Hasher2');

contract('MystikoWithLoopMain', (accounts) => {
  it('should set type correctly', async () => {
    const loopContract = await MystikoWithLoopMain.deployed();
    const bridgeType = await loopContract.bridgeType();
    const assetType = await loopContract.assetType();
    expect(bridgeType).to.equal('loop');
    expect(assetType).to.equal('main');
  });

  it('should set verifier information correctly', async () => {
    const loopContract = await MystikoWithLoopMain.deployed();
    const verifierContract = await Verifier.deployed();
    expect(await loopContract.getVerifierAddress()).to.equal(verifierContract.address);
  });

  it('should set hasher information correctly', async () => {
    const loopContract = await MystikoWithLoopMain.deployed();
    const hasher2Contract = await Hasher2.deployed();
    expect(await loopContract.getHasherAddress()).to.equal(hasher2Contract.address);
  });

  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const skVerify = v1Protocol.secretKeyForVerification(rawSkVerify);
  const skEnc = v1Protocol.secretKeyForEncryption(rawSkEnc);
  const pkVerify = v1Protocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = v1Protocol.publicKeyForEncryption(rawSkEnc);
  let depositTx;

  describe('Test deposit operation', () => {
    it('should deposit successfully', async () => {
      const amount = toDecimals(1, 16);
      const { commitmentHash, privateNote, k, randomS } = await v1Protocol.commitment(
        pkVerify,
        pkEnc,
        amount,
      );
      const loopContract = await MystikoWithLoopMain.deployed();
      const gasEstimated = await loopContract.deposit.estimateGas(
        amount,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS, v1Protocol.RANDOM_SK_SIZE),
        toHex(privateNote),
        { from: accounts[1], value: toHex(amount) },
      );
      depositTx = await loopContract.deposit(
        amount,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS, v1Protocol.RANDOM_SK_SIZE),
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
      expect(merkleTreeInsertEvent.args.leafIndex.eq(toBN(0))).to.equal(true);
      const levels = await loopContract.getLevels();
      const tree = new MerkleTree([toBN(toHexNoPrefix(merkleTreeInsertEvent.args.leaf), 16)], {
        maxLevels: parseInt(levels),
      });
      const root = toBN(tree.root());
      const isKnownRoot = await loopContract.isKnownRoot(toFixedLenHex(root));
      expect(isKnownRoot).to.equal(true);
    });
  });

  describe('Test withdraw operation', () => {
    let proof, publicSignals;
    it('should generate proof successfully', async () => {
      const depositEvent = depositTx.logs.find((e) => e['event'] === 'Deposit');
      const merkleTreeInsertEvent = depositTx.logs.find((e) => e['event'] === 'MerkleTreeInsert');
      const amount = toBN(depositEvent.args.amount.toString());
      const commitmentHash = toBN(toHexNoPrefix(depositEvent.args.commitmentHash), 16);
      const privateNote = toBuff(toHexNoPrefix(depositEvent.args.encryptedNote));
      const treeLeaves = [commitmentHash];
      const treeIndex = Number(merkleTreeInsertEvent.args.leafIndex);
      const fullProof = await v1Protocol.zkProveWithdraw(
        pkVerify,
        skVerify,
        pkEnc,
        skEnc,
        amount,
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
      const result = await v1Protocol.zkVerify(
        proof,
        publicSignals,
        'node_modules/@mystiko/circuits/dist/circom/dev/Withdraw.vkey.json.gz',
      );
      expect(result).to.equal(true);
    });

    it('should withdraw successfully', async () => {
      const recipient = accounts[2];
      const loopContract = await MystikoWithLoopMain.deployed();
      const verifierContract = await Verifier.deployed();
      const proofA = [toBN(proof.pi_a[0]), toBN(proof.pi_a[1])];
      const proofB = [
        [toBN(proof.pi_b[0][1]), toBN(proof.pi_b[0][0])],
        [toBN(proof.pi_b[1][1]), toBN(proof.pi_b[1][0])],
      ];
      const proofC = [toBN(proof.pi_c[0]), toBN(proof.pi_c[1])];
      const rootHash = toBN(publicSignals[0]);
      const serialNumber = toBN(publicSignals[1]);
      const amount = toBN(toDecimals(1, 16).toString());
      const result = await verifierContract.verifyProof(proofA, proofB, proofC, [
        rootHash,
        serialNumber,
        amount,
        recipient,
      ]);
      expect(result).to.equal(true);
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