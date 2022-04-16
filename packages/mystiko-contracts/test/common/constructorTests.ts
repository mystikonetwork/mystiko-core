import { expect } from 'chai';
import { Hasher3 } from '@mystikonetwork/contracts-abi';
import { MerkleTree } from '@mystikonetwork/utils';

export function testLoopConstructor(
  contractName: string,
  mystikoContract: any,
  hasher3: Hasher3,
  minRollupFee: number,
  commitmentPoolAddress: string,
) {
  describe(`Test ${contractName} constructor`, () => {
    it('should initialize hasher3 correctly', async () => {
      expect(await mystikoContract.hasher3()).to.equal(hasher3.address);
    });
    it('should initialize minRollupFee correctly', async () => {
      expect(await mystikoContract.minRollupFee()).to.equal(minRollupFee);
    });
    it('should initialize admin related resources correctly', async () => {
      expect(await mystikoContract.isDepositsDisabled()).to.equal(false);
    });
    it('should initialize commitment pool address correctly', async () => {
      expect(await mystikoContract.associatedCommitmentPool()).to.equal(commitmentPoolAddress);
    });
  });
}

export function testBridgeConstructor(
  contractName: string,
  mystikoContract: any,
  hasher3: Hasher3,
  minBridgeFee: number,
  minExecutorFee: number,
  minRollupFee: number,
  peerChainId: number,
  peerContract: string,
  commitmentPoolAddress: string,
) {
  describe(`Test ${contractName} constructor`, () => {
    it('should initialize hasher3 correctly', async () => {
      expect(await mystikoContract.hasher3()).to.equal(hasher3.address);
    });
    it('should initialize minBridgeFee correctly', async () => {
      expect(await mystikoContract.minBridgeFee()).to.equal(minBridgeFee);
    });
    it('should initialize minExecutorFee correctly', async () => {
      expect(await mystikoContract.minExecutorFee()).to.equal(minExecutorFee);
    });
    it('should initialize minRollupFee correctly', async () => {
      expect(await mystikoContract.minRollupFee()).to.equal(minRollupFee);
    });
    it('should initialize peerMinExecutorFee correctly', async () => {
      expect(await mystikoContract.peerMinExecutorFee()).to.equal(minExecutorFee);
    });
    it('should initialize peerMinRollupFee correctly', async () => {
      expect(await mystikoContract.peerMinRollupFee()).to.equal(minRollupFee);
    });
    it('should initialize peerChainId correctly', async () => {
      expect(await mystikoContract.peerChainId()).to.equal(peerChainId);
    });
    it('should initialize peerContract correctly', async () => {
      expect(await mystikoContract.peerContract()).to.equal(peerContract);
    });
    it('should initialize admin related resources correctly', async () => {
      expect(await mystikoContract.isDepositsDisabled()).to.equal(false);
    });
    it('should initialize commitment pool address correctly', async () => {
      expect(await mystikoContract.associatedCommitmentPool()).to.equal(commitmentPoolAddress);
    });
  });
}

export function testCommitmentPoolConstructor(
  contractName: string,
  mystikoContract: any,
  treeHeight: number,
  rootHistoryLength: number,
  minRollupFee: number,
) {
  describe(`Test ${contractName} constructor`, () => {
    it('should initialize minRollupFee correctly', async () => {
      expect(await mystikoContract.minRollupFee()).to.equal(minRollupFee);
    });
    it('should initialize commitmentQueue related resources correctly', async () => {
      expect((await mystikoContract.commitmentQueueSize()).toNumber()).to.equal(0);
      expect((await mystikoContract.commitmentIncludedCount()).toNumber()).to.equal(0);
    });
    it('should initialize tree related resources correctly', async () => {
      const defaultZero = MerkleTree.calcDefaultZeroElement();
      const zeros = MerkleTree.calcZeros(defaultZero, treeHeight);
      expect((await mystikoContract.treeCapacity()).toNumber()).to.equal(2 ** treeHeight);
      expect((await mystikoContract.currentRoot()).toString()).to.equal(zeros[treeHeight].toString());
      expect(await mystikoContract.currentRootIndex()).to.equal(0);
      expect((await mystikoContract.rootHistory(0)).toString()).to.equal(zeros[treeHeight].toString());
      expect(await mystikoContract.rootHistoryLength()).to.equal(rootHistoryLength);
    });
    it('should initialize admin related resources correctly', async () => {
      expect(await mystikoContract.isVerifierUpdateDisabled()).to.equal(false);
      expect(await mystikoContract.isRollupWhitelistDisabled()).to.equal(false);
    });
  });
}
