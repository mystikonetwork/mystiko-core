import { Withdraw, WithdrawStatus } from '../../src/model/withdraw.js';

test('Test Withdraw getters/setters', () => {
  const withdraw = new Withdraw();
  expect(withdraw.chainId).toBe(undefined);
  expect(withdraw.token).toBe(undefined);
  expect(withdraw.tokenAddress).toBe(undefined);
  expect(withdraw.merkleRootHash).toBe(undefined);
  expect(withdraw.serialNumber).toBe(undefined);
  expect(withdraw.amount).toBe(undefined);
  expect(withdraw.recipientAddress).toBe(undefined);
  expect(withdraw.transactionHash).toBe(undefined);
  expect(withdraw.walletId).toBe(undefined);
  expect(withdraw.shieldedAddress).toBe(undefined);
  expect(withdraw.privateNoteId).toBe(undefined);
  expect(withdraw.status).toBe(undefined);

  withdraw.chainId = 1;
  expect(withdraw.chainId).toBe(1);
  withdraw.token = 'USDT';
  expect(withdraw.token).toBe('USDT');
  withdraw.tokenAddress = '81b7e08f65bdf5648606c89998a9cc8164397647';
  expect(withdraw.tokenAddress).toBe('81b7e08f65bdf5648606c89998a9cc8164397647');
  withdraw.merkleRootHash = '2afed011a3e68d2f2885f4f41fbf917250a8985d18930535f2312173b6f3b242';
  expect(withdraw.merkleRootHash).toBe('2afed011a3e68d2f2885f4f41fbf917250a8985d18930535f2312173b6f3b242');
  withdraw.serialNumber = 'deadbeef';
  expect(withdraw.serialNumber).toBe('deadbeef');
  withdraw.amount = 'baadf00d';
  expect(withdraw.amount).toBe('baadf00d');
  withdraw.recipientAddress = 'd774e153442cb09f5c0d8d1b7bf7fe1bdd86c332';
  expect(withdraw.recipientAddress).toBe('d774e153442cb09f5c0d8d1b7bf7fe1bdd86c332');
  withdraw.transactionHash = '0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad';
  expect(withdraw.transactionHash).toBe('0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad');
  withdraw.walletId = 4500;
  expect(withdraw.walletId).toBe(4500);
  withdraw.shieldedAddress =
    'L9VrizoNHfBdtJsLT1Zp1iWAjqGXaWf9HvSJV9p2a7TszPWLnuTDq7rcLc4ykehRznJWFhvCTvCC1REWGUjR6B3C6';
  expect(withdraw.shieldedAddress).toBe(
    'L9VrizoNHfBdtJsLT1Zp1iWAjqGXaWf9HvSJV9p2a7TszPWLnuTDq7rcLc4ykehRznJWFhvCTvCC1REWGUjR6B3C6',
  );
  withdraw.privateNoteId = 1243;
  expect(withdraw.privateNoteId).toBe(1243);
  expect(() => {
    withdraw.status = 'unknown status';
  }).toThrow();
  withdraw.status = WithdrawStatus.SUCCEEDED;
  expect(withdraw.status).toBe(WithdrawStatus.SUCCEEDED);
});
