import { MerkleTree } from '@mystiko/protocol';

export function testConstructor(
  contractGetter,
  withdrawVerifierGetter,
  { treeHeight = 20, rootHistoryLength = 30, minRollupFee },
) {
  describe('Test Mystiko contract constructor', () => {
    let mystikoContract;
    let withdrawVerifierContract;
    before(async () => {
      mystikoContract = await contractGetter();
      withdrawVerifierContract = await withdrawVerifierGetter();
    });
    it('should initialize withdraw verifier correctly', async () => {
      expect(await mystikoContract.withdrawVerifier()).to.equal(withdrawVerifierContract.address);
    });
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
