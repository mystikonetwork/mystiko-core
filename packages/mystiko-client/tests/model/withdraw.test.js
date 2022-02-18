import { Withdraw, WithdrawStatus } from '../../src/model';
import { readFromFile } from '../../src/config';
import { toDecimals, toBN } from '../../src/utils';

test('Test Withdraw getters/setters', async () => {
  const conf = await readFromFile('tests/config/files/config.test.json');
  const withdraw = new Withdraw();
  expect(withdraw.chainId).toBe(undefined);
  expect(withdraw.asset).toBe(undefined);
  expect(withdraw.assetAddress).toBe(undefined);
  expect(withdraw.assetDecimals).toBe(undefined);
  expect(withdraw.merkleRootHash).toBe(undefined);
  expect(withdraw.serialNumber).toBe(undefined);
  expect(withdraw.amount).toBe(undefined);
  expect(withdraw.recipientAddress).toBe(undefined);
  expect(withdraw.transactionHash).toBe(undefined);
  expect(withdraw.getTxExplorerUrl(conf)).toBe(undefined);
  expect(withdraw.walletId).toBe(undefined);
  expect(withdraw.shieldedAddress).toBe(undefined);
  expect(withdraw.privateNoteId).toBe(undefined);
  expect(withdraw.status).toBe(undefined);
  expect(withdraw.errorMessage).toBe(undefined);

  withdraw.chainId = 1;
  expect(withdraw.chainId).toBe(1);
  withdraw.asset = 'USDT';
  expect(withdraw.asset).toBe('USDT');
  withdraw.assetAddress = '81b7e08f65bdf5648606c89998a9cc8164397647';
  expect(withdraw.assetAddress).toBe('81b7e08f65bdf5648606c89998a9cc8164397647');
  withdraw.merkleRootHash = toBN(
    '19447354833770870638524875755086108986351532686253409466340778588798721438274',
  );
  expect(withdraw.merkleRootHash.toString()).toBe(
    '19447354833770870638524875755086108986351532686253409466340778588798721438274',
  );
  withdraw.serialNumber = toBN('3131961357');
  expect(withdraw.serialNumber.toString()).toBe('3131961357');
  withdraw.amount = toDecimals(1.001);
  expect(withdraw.amount.toString()).toBe('1001000000000000000');
  expect(withdraw.simpleAmount).toBe(1.001);
  withdraw.assetDecimals = 17;
  expect(withdraw.simpleAmount).toBe(10.01);
  withdraw.recipientAddress = 'd774e153442cb09f5c0d8d1b7bf7fe1bdd86c332';
  expect(withdraw.recipientAddress).toBe('d774e153442cb09f5c0d8d1b7bf7fe1bdd86c332');
  withdraw.transactionHash = '0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad';
  expect(withdraw.transactionHash).toBe('0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad');
  expect(withdraw.getTxExplorerUrl(conf)).toBe(
    'https://etherscan.io/tx/0x0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad',
  );
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
  withdraw.errorMessage = 'error';
  expect(withdraw.errorMessage).toBe('error');
  withdraw.assetAddress = undefined;
  expect(withdraw.assetAddress).toBe(undefined);
});
