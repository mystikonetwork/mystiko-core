import { MerkleTree } from '@mystiko/protocol';
import { toDecimals } from '@mystiko/utils';

export function testConstructor(
  contractDeploy,
  contractGetter,
  withdrawVerifierGetter,
  {
    treeHeight = 20,
    rootHistoryLength = 30,
    minBridgeFee = undefined,
    minExecutorFee = undefined,
    minRollupFee = undefined,
  },
) {
  describe('Test Mystiko contract constructor', () => {
    let mystikoContract;
    let withdrawVerifierContract;
    before(async () => {
      if (contractDeploy) {
        await contractDeploy();
      }
      mystikoContract = await contractGetter();
      withdrawVerifierContract = await withdrawVerifierGetter();
    });
    it('should initialize withdraw verifier correctly', async () => {
      expect(await mystikoContract.withdrawVerifier()).to.equal(withdrawVerifierContract.address);
    });
    if (minBridgeFee) {
      it('should initialize minBridgeFee correctly', async () => {
        expect((await mystikoContract.minBridgeFee()).toString()).to.equal(minBridgeFee);
      });
    }
    if (minExecutorFee) {
      it('should initialize minExecutorFee correctly', async () => {
        expect((await mystikoContract.minExecutorFee()).toString()).to.equal(minExecutorFee);
      });
    }
    it('should initialize minRollupFee correctly', async () => {
      expect((await mystikoContract.minRollupFee()).toString()).to.equal(minRollupFee);
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
      expect((await mystikoContract.currentRootIndex()).toNumber()).to.equal(0);
      expect((await mystikoContract.rootHistory(0)).toString()).to.equal(zeros[treeHeight].toString());
      expect((await mystikoContract.rootHistoryLength()).toNumber()).to.equal(rootHistoryLength);
    });
    it('should initialize admin related resources correctly', async () => {
      expect(await mystikoContract.isDepositsDisabled()).to.equal(false);
      expect(await mystikoContract.isVerifierUpdateDisabled()).to.equal(false);
      expect(await mystikoContract.isRollupWhitelistDisabled()).to.equal(false);
    });
  });
}
