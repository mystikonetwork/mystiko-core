import BN from 'bn.js';
import { MerkleTree } from '../../../src/lib/merkleTree';
import { zkProveRollup1, zkProveRollup16, zkProveRollup4 } from '../../../src/rollup/protocol';

export function testRollup(
  contractGetter,
  rollupVerifierContractGetter,
  accounts,
  { rollupSize, treeHeight = 20, rootHistoryLength = 30 },
) {
  let mystikoContract;
  let rollupVerifierContract;
  let depositIncludedCount;
  let depositQueueSize;
  let currentRoot;
  let currentRootIndex;
  let proofA, proofB, proofC, newRoot, leafHash;
  const depositsInQueue = [];
  const newLeaves = [];
  describe('Test Mystiko rollup operation', () => {
    before(async () => {
      mystikoContract = await contractGetter();
      rollupVerifierContract = await rollupVerifierContractGetter();
      let estimateGas = await mystikoContract.enableRollupVerifier.estimateGas(
        rollupSize,
        rollupVerifierContract.address,
        { from: accounts[0] },
      );
      await mystikoContract.enableRollupVerifier(rollupSize, rollupVerifierContract.address, {
        from: accounts[0],
        gas: estimateGas,
      });
      estimateGas = await mystikoContract.addRollupWhitelist.estimateGas(accounts[0], { from: accounts[0] });
      await mystikoContract.addRollupWhitelist(accounts[0], {
        from: accounts[0],
        gas: estimateGas,
      });
      depositIncludedCount = (await mystikoContract.depositIncludedCount()).toNumber();
      expect(depositIncludedCount).to.equal(0);
      depositQueueSize = (await mystikoContract.depositQueueSize()).toNumber();
      expect(depositQueueSize).to.gte(rollupSize);
      currentRootIndex = (await mystikoContract.currentRootIndex()).toNumber();
      currentRoot = (await mystikoContract.currentRoot()).toString();
      expect((await mystikoContract.rootHistory(`${currentRootIndex}`)).toString()).to.equal(currentRoot);
      for (let i = 0; i < rollupSize; i++) {
        depositsInQueue.push(await mystikoContract.depositQueue(`${i + depositIncludedCount}`));
        newLeaves.push(new BN(depositsInQueue[i].commitment.toString()));
      }
      const tree = new MerkleTree(treeHeight);
      expect(tree.root().toString()).to.equal(currentRoot);
      let proof;
      if (rollupSize === 1) {
        proof = await zkProveRollup1(
          tree,
          newLeaves[0],
          'dist/circom/dev/Rollup1.wasm',
          'dist/circom/dev/Rollup1.zkey',
        );
      } else if (rollupSize === 4) {
        proof = await zkProveRollup4(
          tree,
          newLeaves,
          'dist/circom/dev/Rollup4.wasm',
          'dist/circom/dev/Rollup4.zkey',
        );
      } else if (rollupSize === 16) {
        proof = await zkProveRollup16(
          tree,
          newLeaves,
          'dist/circom/dev/Rollup16.wasm',
          'dist/circom/dev/Rollup16.zkey',
        );
      }
      expect(proof).to.not.equal(undefined);
      proofA = [proof.proof.pi_a[0], proof.proof.pi_a[1]];
      proofB = [
        [proof.proof.pi_b[0][1], proof.proof.pi_b[0][0]],
        [proof.proof.pi_b[1][1], proof.proof.pi_b[1][0]],
      ];
      proofC = [proof.proof.pi_c[0], proof.proof.pi_c[1]];
      newRoot = proof.publicSignals[1];
      leafHash = proof.publicSignals[3];
    });
    it('should rollup successfully', async () => {
      let estimateGas = await mystikoContract.rollup.estimateGas(
        proofA,
        proofB,
        proofC,
        `${rollupSize}`,
        newRoot,
        leafHash,
        { from: accounts[0] },
      );
      await mystikoContract.rollup(proofA, proofB, proofC, `${rollupSize}`, newRoot, leafHash, {
        from: accounts[0],
        gas: estimateGas,
      });
      expect((await mystikoContract.depositIncludedCount()).toNumber()).to.equal(
        depositIncludedCount + rollupSize,
      );
      expect((await mystikoContract.currentRoot()).toString()).to.equal(newRoot);
      expect((await mystikoContract.currentRootIndex()).toNumber()).to.equal(
        (currentRootIndex + 1) % rootHistoryLength,
      );
      expect(await mystikoContract.isKnownRoot(newRoot)).to.equal(true);
      expect((await mystikoContract.depositQueueSize()).toNumber()).to.equal(depositQueueSize - rollupSize);
    });
  });
}
