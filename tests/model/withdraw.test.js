import BN from 'bn.js';
import { Withdraw, WithdrawStatus } from '../../src/model/withdraw.js';
import { toBuff, toHexNoPrefix } from '../../src/utils.js';

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
  withdraw.merkleRootHash = new BN(
    '19447354833770870638524875755086108986351532686253409466340778588798721438274',
  );
  expect(withdraw.merkleRootHash.toString()).toBe(
    '19447354833770870638524875755086108986351532686253409466340778588798721438274',
  );
  withdraw.serialNumber = toBuff('deadbeef');
  expect(toHexNoPrefix(withdraw.serialNumber)).toBe('deadbeef');
  withdraw.amount = new BN('3131961357');
  expect(withdraw.amount.toString()).toBe('3131961357');
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
