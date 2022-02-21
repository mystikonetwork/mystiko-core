import { expectThrowsAsync } from './utils.js';

export function testAdminOperations(contractGetter, accounts) {
  let mystikoContract;
  describe('Test Mystiko admin operations', () => {
    before(async () => {
      mystikoContract = await contractGetter();
    });
    it('should toggle isDepositDisabled correctly', async () => {
      await expectThrowsAsync(() => mystikoContract.toggleDeposits.estimateGas(true, { from: accounts[1] }));
      const gasEstimate = await mystikoContract.toggleDeposits.estimateGas(true, { from: accounts[0] });
      await mystikoContract.toggleDeposits(true, { from: accounts[0], gas: gasEstimate });
      expect(await mystikoContract.isDepositsDisabled()).to.equal(true);
      await mystikoContract.toggleDeposits(false, { from: accounts[0], gas: gasEstimate });
      expect(await mystikoContract.isDepositsDisabled()).to.equal(false);
    });
    it('should toggle isRollupWhitelistDisabled correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.toggleRollupWhitelist.estimateGas(true, { from: accounts[1] }),
      );
      const gasEstimate = await mystikoContract.toggleRollupWhitelist.estimateGas(true, {
        from: accounts[0],
      });
      await mystikoContract.toggleRollupWhitelist(true, { from: accounts[0], gas: gasEstimate });
      expect(await mystikoContract.isRollupWhitelistDisabled()).to.equal(true);
      await mystikoContract.toggleRollupWhitelist(false, { from: accounts[0], gas: gasEstimate });
      expect(await mystikoContract.isRollupWhitelistDisabled()).to.equal(false);
    });
    it('should toggle isVerifierUpdateDisabled correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.toggleVerifierUpdate.estimateGas(true, { from: accounts[1] }),
      );
      const gasEstimate = await mystikoContract.toggleVerifierUpdate.estimateGas(true, {
        from: accounts[0],
      });
      await mystikoContract.toggleVerifierUpdate(true, { from: accounts[0], gas: gasEstimate });
      expect(await mystikoContract.isVerifierUpdateDisabled()).to.equal(true);
      await mystikoContract.toggleVerifierUpdate(false, { from: accounts[0], gas: gasEstimate });
      expect(await mystikoContract.isVerifierUpdateDisabled()).to.equal(false);
    });
    it('should setWithdrawVerifier correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.setWithdrawVerifier('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
          from: accounts[1],
        }),
      );
      let gasEstimate = await mystikoContract.setWithdrawVerifier.estimateGas(
        '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f',
        {
          from: accounts[0],
        },
      );
      await mystikoContract.setWithdrawVerifier('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
        from: accounts[0],
        gas: gasEstimate,
      });
      expect(await mystikoContract.withdrawVerifier()).to.equal('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f');
      gasEstimate = await mystikoContract.toggleVerifierUpdate.estimateGas(true, {
        from: accounts[0],
      });
      await mystikoContract.toggleVerifierUpdate(true, { from: accounts[0], gas: gasEstimate });
      await expectThrowsAsync(() =>
        mystikoContract.setWithdrawVerifier('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
          from: accounts[0],
        }),
      );
      await mystikoContract.toggleVerifierUpdate(false, { from: accounts[0], gas: gasEstimate });
    });
    it('should enableRollupVerifier correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.enableRollupVerifier.estimateGas(4, '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
          from: accounts[1],
        }),
      );
      await expectThrowsAsync(() =>
        mystikoContract.enableRollupVerifier.estimateGas(0, '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
          from: accounts[0],
        }),
      );
      let estimateGas = await mystikoContract.enableRollupVerifier.estimateGas(
        4,
        '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f',
        {
          from: accounts[0],
        },
      );
      await mystikoContract.enableRollupVerifier(4, '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
        from: accounts[0],
        gas: estimateGas,
      });
      const verifier = await mystikoContract.rollupVerifiers(4);
      expect(verifier.verifier).to.equal('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f');
      expect(verifier.enabled).to.equal(true);
      estimateGas = await mystikoContract.toggleVerifierUpdate.estimateGas(true, {
        from: accounts[0],
      });
      await mystikoContract.toggleVerifierUpdate(true, { from: accounts[0], gas: estimateGas });
      await expectThrowsAsync(() =>
        mystikoContract.enableRollupVerifier.estimateGas(4, '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
          from: accounts[0],
        }),
      );
      await mystikoContract.toggleVerifierUpdate(false, { from: accounts[0], gas: estimateGas });
    });
    it('should disableRollupVerifier correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.disableRollupVerifier.estimateGas(4, {
          from: accounts[1],
        }),
      );
      await expectThrowsAsync(() =>
        mystikoContract.disableRollupVerifier.estimateGas(0, {
          from: accounts[0],
        }),
      );
      let estimateGas = await mystikoContract.enableRollupVerifier.estimateGas(
        4,
        '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f',
        {
          from: accounts[0],
        },
      );
      await mystikoContract.enableRollupVerifier(4, '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
        from: accounts[0],
        gas: estimateGas,
      });
      estimateGas = await mystikoContract.disableRollupVerifier.estimateGas(4, {
        from: accounts[0],
      });
      await mystikoContract.disableRollupVerifier(4, {
        from: accounts[0],
        gas: estimateGas,
      });
      const verifier = await mystikoContract.rollupVerifiers(4);
      expect(verifier.verifier).to.equal('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f');
      expect(verifier.enabled).to.equal(false);
      estimateGas = await mystikoContract.toggleVerifierUpdate.estimateGas(true, {
        from: accounts[0],
      });
      await mystikoContract.toggleVerifierUpdate(true, { from: accounts[0], gas: estimateGas });
      await expectThrowsAsync(() =>
        mystikoContract.disableRollupVerifier.estimateGas(4, {
          from: accounts[0],
        }),
      );
      await mystikoContract.toggleVerifierUpdate(false, { from: accounts[0], gas: estimateGas });
    });
    it('should addRollupWhitelist correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.addRollupWhitelist.estimateGas('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
          from: accounts[1],
        }),
      );
      expect(await mystikoContract.rollupWhitelist('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f')).to.equal(
        false,
      );
      let estimateGas = mystikoContract.addRollupWhitelist.estimateGas(
        '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f',
        { from: accounts[0] },
      );
      await mystikoContract.addRollupWhitelist('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
        from: accounts[0],
        gas: estimateGas,
      });
      expect(await mystikoContract.rollupWhitelist('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f')).to.equal(
        true,
      );
    });
    it('should removeRollupWhitelist correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.removeRollupWhitelist.estimateGas('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
          from: accounts[1],
        }),
      );
      let estimateGas = mystikoContract.addRollupWhitelist.estimateGas(
        '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f',
        { from: accounts[0] },
      );
      await mystikoContract.addRollupWhitelist('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
        from: accounts[0],
        gas: estimateGas,
      });
      estimateGas = mystikoContract.removeRollupWhitelist.estimateGas(
        '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f',
        { from: accounts[0] },
      );
      await mystikoContract.removeRollupWhitelist('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
        from: accounts[0],
        gas: estimateGas,
      });
      expect(await mystikoContract.rollupWhitelist('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f')).to.equal(
        false,
      );
    });
    it('should changeOperator correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.changeOperator.estimateGas(accounts[1], { from: accounts[1] }),
      );
      // let estimateGas = await mystikoContract.changeOperator.estimateGas(accounts[1], { from: accounts[0] });
      await mystikoContract.changeOperator(accounts[1], { from: accounts[0], gasLimit: 200000 });
      expect(await mystikoContract.operator()).to.equal(accounts[1]);
      await mystikoContract.changeOperator(accounts[0], { from: accounts[1], gasLimit: 200000 });
      expect(await mystikoContract.operator()).to.equal(accounts[0]);
    });
  });
}
