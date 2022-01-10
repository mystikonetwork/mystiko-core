import { Deposit, DepositStatus } from '../../src/model/deposit.js';

test('Test Deposit getters/setters', () => {
  const deposit = new Deposit();
  expect(deposit.srcChainId).toBe(undefined);
  expect(deposit.dstChainId).toBe(undefined);
  expect(deposit.bridge).toBe(undefined);
  expect(deposit.token).toBe(undefined);
  expect(deposit.tokenAddress).toBe(undefined);
  expect(deposit.amount).toBe(undefined);
  expect(deposit.commitmentHash).toBe(undefined);
  expect(deposit.encryptedNote).toBe(undefined);
  expect(deposit.transactionHash).toBe(undefined);
  expect(deposit.walletId).toBe(undefined);
  expect(deposit.srcAddress).toBe(undefined);
  expect(deposit.shieldedRecipientAddress).toBe(undefined);
  expect(deposit.status).toBe(undefined);

  deposit.srcChainId = 1;
  expect(deposit.srcChainId).toBe(1);
  deposit.dstChainId = 2;
  expect(deposit.dstChainId).toBe(2);
  deposit.bridge = 'poly';
  expect(deposit.bridge).toBe('poly');
  deposit.token = 'USDT';
  expect(deposit.token).toBe('USDT');
  deposit.tokenAddress = '81b7e08f65bdf5648606c89998a9cc8164397647';
  expect(deposit.tokenAddress).toBe('81b7e08f65bdf5648606c89998a9cc8164397647');
  deposit.amount = 'deadbeef';
  expect(deposit.amount).toBe('deadbeef');
  deposit.commitmentHash = '2afed011a3e68d2f2885f4f41fbf917250a8985d18930535f2312173b6f3b242';
  expect(deposit.commitmentHash).toBe('2afed011a3e68d2f2885f4f41fbf917250a8985d18930535f2312173b6f3b242');
  deposit.encryptedNote = 'deaddead';
  expect(deposit.encryptedNote).toBe('deaddead');
  deposit.transactionHash = '0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad';
  expect(deposit.transactionHash).toBe('0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad');
  deposit.walletId = 200;
  expect(deposit.walletId).toBe(200);
  deposit.srcAddress = 'd774e153442cb09f5c0d8d1b7bf7fe1bdd86c332';
  expect(deposit.srcAddress).toBe('d774e153442cb09f5c0d8d1b7bf7fe1bdd86c332');
  deposit.shieldedRecipientAddress =
    'L9VrizoNHfBdtJsLT1Zp1iWAjqGXaWf9HvSJV9p2a7TszPWLnuTDq7rcLc4ykehRznJWFhvCTvCC1REWGUjR6B3C6';
  expect(deposit.shieldedRecipientAddress).toBe(
    'L9VrizoNHfBdtJsLT1Zp1iWAjqGXaWf9HvSJV9p2a7TszPWLnuTDq7rcLc4ykehRznJWFhvCTvCC1REWGUjR6B3C6',
  );
  expect(() => {
    deposit.status = 'unknown status';
  }).toThrow();
  deposit.status = DepositStatus.SRC_PENDING;
  expect(deposit.status).toBe(DepositStatus.SRC_PENDING);
});
