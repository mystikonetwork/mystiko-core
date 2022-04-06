import { expect } from 'chai';
import { MerkleTree } from '@mystikonetwork/utils';
import { Hasher3 } from '../../typechain';

export function testConstructor(
  contractName: string,
  mystikoContract: any,
  hasher3: Hasher3,
  treeHeight: number,
  rootHistoryLength: number,
  minBridgeFee: number | undefined,
  minExecutorFee: number | undefined,
  minRollupFee: number,
) {
  describe(`Test ${contractName} constructor`, () => {
    it('should initialize hasher3 correctly', async () => {
      expect(await mystikoContract.hasher3()).to.equal(hasher3.address);
    });
    if (minBridgeFee !== undefined) {
      it('should initialize minBridgeFee correctly', async () => {
        expect(await mystikoContract.minBridgeFee()).to.equal(minBridgeFee);
      });
    }
    if (minExecutorFee !== undefined) {
      it('should initialize minExecutorFee correctly', async () => {
        expect(await mystikoContract.minExecutorFee()).to.equal(minExecutorFee);
      });
    }
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
      expect(await mystikoContract.isDepositsDisabled()).to.equal(false);
      expect(await mystikoContract.isVerifierUpdateDisabled()).to.equal(false);
      expect(await mystikoContract.isRollupWhitelistDisabled()).to.equal(false);
    });
  });
}
