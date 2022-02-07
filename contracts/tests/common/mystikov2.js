let mystikoContract;
let withdrawVerifierContract;

export function testConstructor({
  MystikoContract,
  WithdrawVerifierContract,
  treeHeight = 20,
  rootHistoryLength = 30,
  minRollupFee,
}) {
  describe('Test Mystiko Contract Constructor', () => {
    beforeEach(async () => {
      mystikoContract = await MystikoContract.deployed();
      withdrawVerifierContract = await WithdrawVerifierContract.deployed();
    });
    it('should set withdraw verifier correctly', async () => {
      expect(await mystikoContract.withdrawVerifier()).to.equal(withdrawVerifierContract.address);
    });
    it('should set treeCapacity correctly', async () => {
      const treeCapacity = await mystikoContract.treeCapacity();
      expect(treeCapacity.toNumber()).to.equal(2 ** treeHeight);
    });
    it('should set rootHistoryLength correctly', async () => {
      const actualRootHistoryLength = await mystikoContract.rootHistoryLength();
      expect(actualRootHistoryLength.toNumber()).to.equal(rootHistoryLength);
    });
    it('should set minRollupFee correctly', async () => {
      const actualMinRollupFee = await mystikoContract.minRollupFee();
      expect(actualMinRollupFee.toString()).to.equal(minRollupFee);
    });
  });
}
