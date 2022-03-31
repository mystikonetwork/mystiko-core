import { Wallet } from '@ethersproject/wallet';
import { MerkleTree, v1Protocol } from '@mystikonetwork/protocol';
import { toBN } from '@mystikonetwork/utils';
import { TestToken } from '../../typechain';
import {
  MerkleTreeHeight,
  MinRollupFee,
  RollupAccountIndex1,
  RollupAccountIndex2,
  RootHistoryLength,
} from '../util/constants';

const { waffle } = require('hardhat');
const { expect } = require('chai');

async function enableRollupVerifier(
  mystikoContract: any,
  rollupVerifierContract: any,
  rollupSize: number,
  rollupAccount1: Wallet,
  rollupAccount2: Wallet,
) {
  await mystikoContract.enableRollupVerifier(rollupSize, rollupVerifierContract.address);
  await mystikoContract.addRollupWhitelist(rollupAccount1.address);
  await mystikoContract.addRollupWhitelist(rollupAccount2.address);
}

async function generateProof(
  commitments: any[],
  mystikoContract: any,
  treeHeight: number,
  rollupSize: number,
) {
  const oldLeaves = [];
  const depositsInQueue = [];
  const newLeaves = [];
  const depositIncludedCount = (await mystikoContract.depositIncludedCount()).toNumber();
  for (let i = 0; i < depositIncludedCount; i += 1) {
    oldLeaves.push(commitments[i].commitmentHash);
  }
  const depositQueueSize = (await mystikoContract.depositQueueSize()).toNumber();
  expect(depositQueueSize).to.gte(rollupSize);
  const currentRootIndex = await mystikoContract.currentRootIndex();
  const currentRoot = (await mystikoContract.currentRoot()).toString();
  expect((await mystikoContract.rootHistory(`${currentRootIndex}`)).toString()).to.equal(currentRoot);
  for (let i = 0; i < rollupSize; i += 1) {
    depositsInQueue.push(await mystikoContract.depositQueue(`${i + depositIncludedCount}`));
    newLeaves.push(toBN(depositsInQueue[i].commitment.toString()));
  }
  const tree = new MerkleTree(oldLeaves, { maxLevels: treeHeight });
  expect(tree.root().toString()).to.equal(currentRoot);
  let proof: any;
  if (rollupSize === 1) {
    proof = await v1Protocol.zkProveRollup1(
      tree,
      newLeaves[0],
      'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup1.wasm.gz',
      'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup1.zkey.gz',
    );
  } else if (rollupSize === 4) {
    proof = await v1Protocol.zkProveRollup4(
      tree,
      newLeaves,
      'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup4.wasm.gz',
      'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup4.zkey.gz',
    );
  } else if (rollupSize === 16) {
    proof = await v1Protocol.zkProveRollup16(
      tree,
      newLeaves,
      'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup16.wasm.gz',
      'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup16.zkey.gz',
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

export function testRollup(
  mystikoContract: any,
  rollupVerifierContract: any,
  testTokenContract: TestToken,
  accounts: Wallet[],
  commitments: any[],
  {
    isMainAsset = true,
    rollupFee = MinRollupFee,
    rollupSize = 4,
    treeHeight = MerkleTreeHeight,
    rootHistoryLength = RootHistoryLength,
  },
) {
  let proof: any;
  const rollupAccount = accounts[RollupAccountIndex1];
  const rollupAccount2 = accounts[RollupAccountIndex2];

  describe(`Test Mystiko rollup ${rollupSize} operation`, () => {
    before(async () => {
      await enableRollupVerifier(
        mystikoContract,
        rollupVerifierContract,
        rollupSize,
        rollupAccount,
        rollupAccount2,
      );
      proof = await generateProof(commitments, mystikoContract, treeHeight, rollupSize);
    });

    it('should revert known root', async () => {
      await expect(
        mystikoContract
          .connect(rollupAccount)
          .rollup(
            proof.proofA,
            proof.proofB,
            proof.proofC,
            `${rollupSize}`,
            proof.currentRoot,
            proof.leafHash,
          ),
      ).to.be.revertedWith('newRoot is duplicated');
    });

    it('should revert unsupported rollup Size', () => {
      expect(
        mystikoContract
          .connect(rollupAccount)
          .rollup(proof.proofA, proof.proofB, proof.proofC, 1234, proof.newRoot, proof.leafHash),
      ).to.be.revertedWith('invalid rollupSize');
    });

    it('should revert wrong leaf hash', () => {
      expect(
        mystikoContract
          .connect(rollupAccount)
          .rollup(
            proof.proofA,
            proof.proofB,
            proof.proofC,
            `${rollupSize}`,
            proof.newRoot,
            v1Protocol.randomBigInt().toString(),
          ),
      ).to.be.revertedWith('invalid leafHash');
    });

    it('should revert wrong proof', () => {
      expect(
        mystikoContract
          .connect(rollupAccount)
          .rollup(
            proof.proofA,
            proof.proofB,
            proof.proofC,
            `${rollupSize}`,
            v1Protocol.randomBigInt().toString(),
            proof.leafHash,
          ),
      ).to.be.revertedWith('invalid proof');
    });

    it('should rollup successfully', async () => {
      const balanceBefore = isMainAsset
        ? await waffle.provider.getBalance(rollupAccount2.address)
        : await testTokenContract.balanceOf(rollupAccount2.address);

      const rollupTx = await mystikoContract
        .connect(rollupAccount2)
        .rollup(proof.proofA, proof.proofB, proof.proofC, `${rollupSize}`, proof.newRoot, proof.leafHash);

      const txReceipt = await waffle.provider.getTransactionReceipt(rollupTx.hash);
      const totalGasFee = txReceipt.cumulativeGasUsed.mul(txReceipt.effectiveGasPrice);

      const balanceAfter = isMainAsset
        ? await waffle.provider.getBalance(rollupAccount2.address)
        : await testTokenContract.balanceOf(rollupAccount2.address);

      const totalRollupFee = isMainAsset
        ? balanceAfter.add(totalGasFee).sub(balanceBefore)
        : balanceAfter.sub(balanceBefore);
      const expectRollupFee = toBN(rollupFee).muln(rollupSize).toString();
      expect(totalRollupFee.toString()).to.equal(expectRollupFee.toString());

      expect((await mystikoContract.depositIncludedCount()).toNumber()).to.equal(
        proof.depositIncludedCount + rollupSize,
      );
      expect((await mystikoContract.currentRoot()).toString()).to.equal(proof.newRoot);
      expect(await mystikoContract.currentRootIndex()).to.equal(
        (proof.currentRootIndex + 1) % rootHistoryLength,
      );
      expect(await mystikoContract.isKnownRoot(proof.newRoot)).to.equal(true);
      expect((await mystikoContract.depositQueueSize()).toNumber()).to.equal(
        proof.depositQueueSize - rollupSize,
      );
    });
  });
}
