import { expect } from 'chai';
import { Wallet } from '@ethersproject/wallet';
import { TestToken } from '@mystikonetwork/contracts-abi';
import { CommitmentV1, MystikoProtocolV2 } from '@mystikonetwork/protocol';
import { toBN, MerkleTree, toHexNoPrefix } from '@mystikonetwork/utils';
import {
  MerkleTreeHeight,
  MinRollupFee,
  RollupAccountIndex1,
  RollupAccountIndex2,
  RootHistoryLength,
} from '../util/constants';

const { waffle } = require('hardhat');

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
  protocol: MystikoProtocolV2,
  commitments: CommitmentV1[],
  mystikoContract: any,
  treeHeight: number,
  rollupSize: number,
) {
  const oldLeaves = [];
  const commitmentsInQueue = [];
  const newLeaves = [];
  const commitmentIncludedCount = (await mystikoContract.commitmentIncludedCount()).toNumber();
  for (let i = 0; i < commitmentIncludedCount; i += 1) {
    oldLeaves.push(commitments[i].commitmentHash);
  }
  const commitmentQueueSize = (await mystikoContract.commitmentQueueSize()).toNumber();
  expect(commitmentQueueSize).to.gte(rollupSize);
  const currentRootIndex = await mystikoContract.currentRootIndex();
  const currentRoot = (await mystikoContract.currentRoot()).toString();
  expect((await mystikoContract.rootHistory(`${currentRootIndex}`)).toString()).to.equal(currentRoot);
  for (let i = 0; i < rollupSize; i += 1) {
    commitmentsInQueue.push(await mystikoContract.commitmentQueue(`${i + commitmentIncludedCount}`));
    newLeaves.push(toBN(commitmentsInQueue[i].commitment.toString()));
  }
  const tree = new MerkleTree(oldLeaves, { maxLevels: treeHeight });
  expect(tree.root().toString()).to.equal(currentRoot);
  let proof: any;
  if (rollupSize === 1) {
    proof = await protocol.zkProveRollup({
      tree,
      newLeaves,
      programFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup1.program.gz',
      abiFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup1.abi.json',
      provingKeyFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup1.pkey.gz',
    });
  } else if (rollupSize === 4) {
    proof = await protocol.zkProveRollup({
      tree,
      newLeaves,
      programFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup4.program.gz',
      abiFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup4.abi.json',
      provingKeyFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup4.pkey.gz',
    });
  } else if (rollupSize === 16) {
    proof = await protocol.zkProveRollup({
      tree,
      newLeaves,
      programFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup16.program.gz',
      abiFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup16.abi.json',
      provingKeyFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup16.pkey.gz',
    });
  }
  expect(proof).to.not.equal(undefined);
  const proofA = proof.proof.a;
  const proofB = proof.proof.b;
  const proofC = proof.proof.c;
  const newRoot = proof.inputs[1];
  const leafHash = proof.inputs[2];
  return {
    commitmentIncludedCount,
    currentRoot,
    currentRootIndex,
    commitmentQueueSize,
    proofA,
    proofB,
    proofC,
    newRoot,
    leafHash,
  };
}

export function testRollup(
  contractName: string,
  protocol: MystikoProtocolV2,
  commitmentPoolContract: any,
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

  describe(`Test ${contractName} rollup${rollupSize} operation`, () => {
    before(async () => {
      await enableRollupVerifier(
        commitmentPoolContract,
        rollupVerifierContract,
        rollupSize,
        rollupAccount,
        rollupAccount2,
      );
      proof = await generateProof(protocol, commitments, commitmentPoolContract, treeHeight, rollupSize);
    });

    it('should revert known root', async () => {
      await expect(
        commitmentPoolContract
          .connect(rollupAccount)
          .rollup([
            [proof.proofA, proof.proofB, proof.proofC],
            `${rollupSize}`,
            proof.currentRoot,
            proof.leafHash,
          ]),
      ).to.be.revertedWith('newRoot is duplicated');
    });

    it('should revert unsupported rollup Size', () => {
      expect(
        commitmentPoolContract
          .connect(rollupAccount)
          .rollup([[proof.proofA, proof.proofB, proof.proofC], 1234, proof.newRoot, proof.leafHash]),
      ).to.be.revertedWith('invalid rollupSize');
    });

    it('should revert wrong leaf hash', () => {
      expect(
        commitmentPoolContract
          .connect(rollupAccount)
          .rollup([
            [proof.proofA, proof.proofB, proof.proofC],
            `${rollupSize}`,
            proof.newRoot,
            protocol.randomBigInt().toString(),
          ]),
      ).to.be.revertedWith('invalid leafHash');
    });

    it('should revert wrong proof', () => {
      expect(
        commitmentPoolContract
          .connect(rollupAccount)
          .rollup([
            [proof.proofA, proof.proofB, proof.proofC],
            `${rollupSize}`,
            protocol.randomBigInt().toString(),
            proof.leafHash,
          ]),
      ).to.be.revertedWith('invalid proof');
    });

    it('should rollup successfully', async () => {
      const balanceBefore = isMainAsset
        ? await waffle.provider.getBalance(rollupAccount2.address)
        : await testTokenContract.balanceOf(rollupAccount2.address);

      const rollupTx = await commitmentPoolContract
        .connect(rollupAccount2)
        .rollup([[proof.proofA, proof.proofB, proof.proofC], `${rollupSize}`, proof.newRoot, proof.leafHash]);

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

      expect((await commitmentPoolContract.commitmentIncludedCount()).toNumber()).to.equal(
        proof.commitmentIncludedCount + rollupSize,
      );
      expect((await commitmentPoolContract.currentRoot()).toString()).to.equal(
        toBN(toHexNoPrefix(proof.newRoot), 16).toString(),
      );
      expect(await commitmentPoolContract.currentRootIndex()).to.equal(
        (proof.currentRootIndex + 1) % rootHistoryLength,
      );
      expect(await commitmentPoolContract.isKnownRoot(proof.newRoot)).to.equal(true);
      expect((await commitmentPoolContract.commitmentQueueSize()).toNumber()).to.equal(
        proof.commitmentQueueSize - rollupSize,
      );
    });
  });
}
