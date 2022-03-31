import { MerkleTree } from '@mystikonetwork/protocol';
import { WithdrawVerifier } from '../../typechain';

const { expect } = require('chai');

export function testConstructor(
  mystikoContract: any,
  withdrawVerifierContract: WithdrawVerifier,
  treeHeight: number,
  rootHistoryLength: number,
  minBridgeFee: number | undefined,
  minExecutorFee: number | undefined,
  minRollupFee: number,
) {
  describe('Test Mystiko contract constructor', () => {
    before(async () => {});

    it('should initialize withdraw verifier correctly', async () => {
      expect(await mystikoContract.withdrawVerifier()).to.equal(withdrawVerifierContract.address);
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
    it('should initialize depositQueue related resources correctly', async () => {
      expect((await mystikoContract.depositQueueSize()).toNumber()).to.equal(0);
      expect((await mystikoContract.depositIncludedCount()).toNumber()).to.equal(0);
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
