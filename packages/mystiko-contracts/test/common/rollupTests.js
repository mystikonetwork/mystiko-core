import { randomBigInt } from '@mystiko/client/src/protocol';
import { MerkleTree } from '@mystiko/client/src/lib/merkleTree';
import { zkProveRollup1, zkProveRollup16, zkProveRollup4 } from '@mystiko/client/src/rollup/protocol';
import { toBN } from '@mystiko/client/src/utils.js';
import { expectThrowsAsync } from './utils';

export function testRollup(
  contractGetter,
  rollupVerifierContractGetter,
  accounts,
  { commitments, rollupSize, treeHeight = 20, rootHistoryLength = 30 },
) {
  let mystikoContract;
  let rollupVerifierContract;
  let proof;
  describe(`Test Mystiko rollup ${rollupSize} operation`, () => {
    before(async () => {
      mystikoContract = await contractGetter();
      rollupVerifierContract = await rollupVerifierContractGetter();
      await _enableRollupVerifier(mystikoContract, rollupVerifierContract, rollupSize, accounts);
      proof = await _generateProof(commitments, mystikoContract, treeHeight, rollupSize);
    });
    it('should revert known root', () => {
      expectThrowsAsync(() =>
        mystikoContract.rollup(
          proof.proofA,
          proof.proofB,
          proof.proofC,
          `${rollupSize}`,
          proof.currentRoot,
          proof.leafHash,
          {
            from: accounts[0],
            gas: 1000000,
          },
        ),
      );
    });
    it('should revert unsupported rollup Size', () => {
      expectThrowsAsync(() =>
        mystikoContract.rollup(
          proof.proofA,
          proof.proofB,
          proof.proofC,
          1234,
          proof.newRoot,
          proof.leafHash,
          {
            from: accounts[0],
            gas: 1000000,
          },
        ),
      );
    });
    it('should revert wrong leaf hash', () => {
      expectThrowsAsync(() =>
        mystikoContract.rollup(
          proof.proofA,
          proof.proofB,
          proof.proofC,
          `${rollupSize}`,
          proof.newRoot,
          randomBigInt().toString(),
          {
            from: accounts[0],
            gas: 1000000,
          },
        ),
      );
    });
    it('should revert wrong proof', () => {
      expectThrowsAsync(() =>
        mystikoContract.rollup(
          proof.proofA,
          proof.proofB,
          proof.proofC,
          `${rollupSize}`,
          randomBigInt().toString(),
          proof.leafHash,
          {
            from: accounts[0],
            gas: 1000000,
          },
        ),
      );
    });
    it('should rollup successfully', async () => {
      await mystikoContract.rollup(
        proof.proofA,
        proof.proofB,
        proof.proofC,
        `${rollupSize}`,
        proof.newRoot,
        proof.leafHash,
        {
          from: accounts[0],
          gas: 1000000,
        },
      );
      expect((await mystikoContract.depositIncludedCount()).toNumber()).to.equal(
        proof.depositIncludedCount + rollupSize,
      );
      expect((await mystikoContract.currentRoot()).toString()).to.equal(proof.newRoot);
      expect((await mystikoContract.currentRootIndex()).toNumber()).to.equal(
        (proof.currentRootIndex + 1) % rootHistoryLength,
      );
      expect(await mystikoContract.isKnownRoot(proof.newRoot)).to.equal(true);
      expect((await mystikoContract.depositQueueSize()).toNumber()).to.equal(
        proof.depositQueueSize - rollupSize,
      );
    });
  });
}

async function _enableRollupVerifier(mystikoContract, rollupVerifierContract, rollupSize, accounts) {
  await mystikoContract.enableRollupVerifier(rollupSize, rollupVerifierContract.address, {
    from: accounts[0],
    gas: 1000000,
  });
  await mystikoContract.addRollupWhitelist(accounts[0], {
    from: accounts[0],
    gas: 1000000,
  });
}

async function _generateProof(commitments, mystikoContract, treeHeight, rollupSize) {
  const oldLeaves = [];
  const depositsInQueue = [];
  const newLeaves = [];
  const depositIncludedCount = (await mystikoContract.depositIncludedCount()).toNumber();
  for (let i = 0; i < depositIncludedCount; i++) {
    oldLeaves.push(commitments[i].commitmentHash);
  }
  const depositQueueSize = (await mystikoContract.depositQueueSize()).toNumber();
  expect(depositQueueSize).to.gte(rollupSize);
  const currentRootIndex = (await mystikoContract.currentRootIndex()).toNumber();
  const currentRoot = (await mystikoContract.currentRoot()).toString();
  expect((await mystikoContract.rootHistory(`${currentRootIndex}`)).toString()).to.equal(currentRoot);
  for (let i = 0; i < rollupSize; i++) {
    depositsInQueue.push(await mystikoContract.depositQueue(`${i + depositIncludedCount}`));
    newLeaves.push(toBN(depositsInQueue[i].commitment.toString()));
  }
  const tree = new MerkleTree(treeHeight, oldLeaves);
  expect(tree.root().toString()).to.equal(currentRoot);
  let proof;
  if (rollupSize === 1) {
    proof = await zkProveRollup1(
      tree,
      newLeaves[0],
      'node_modules/@mystiko/circuits/dist/circom/dev/Rollup1.wasm.gz',
      'node_modules/@mystiko/circuits/dist/circom/dev/Rollup1.zkey.gz',
    );
  } else if (rollupSize === 4) {
    proof = await zkProveRollup4(
      tree,
      newLeaves,
      'node_modules/@mystiko/circuits/dist/circom/dev/Rollup4.wasm.gz',
      'node_modules/@mystiko/circuits/dist/circom/dev/Rollup4.zkey.gz',
    );
  } else if (rollupSize === 16) {
    proof = await zkProveRollup16(
      tree,
      newLeaves,
      'node_modules/@mystiko/circuits/dist/circom/dev/Rollup16.wasm.gz',
      'node_modules/@mystiko/circuits/dist/circom/dev/Rollup16.zkey.gz',
    );
  }
  expect(proof).to.not.equal(undefined);
  const proofA = [proof.proof.pi_a[0], proof.proof.pi_a[1]];
  const proofB = [
    [proof.proof.pi_b[0][1], proof.proof.pi_b[0][0]],
    [proof.proof.pi_b[1][1], proof.proof.pi_b[1][0]],
  ];
  const proofC = [proof.proof.pi_c[0], proof.proof.pi_c[1]];
  const newRoot = proof.publicSignals[1];
  const leafHash = proof.publicSignals[3];
  return {
    depositIncludedCount,
    currentRoot,
    currentRootIndex,
    depositQueueSize,
    proofA,
    proofB,
    proofC,
    newRoot,
    leafHash,
  };
}
