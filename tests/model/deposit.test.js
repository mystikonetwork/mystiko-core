import BN from 'bn.js';
import { Deposit, DepositStatus } from '../../src/model';
import { toBuff, toHexNoPrefix } from '../../src/utils.js';
import { readFromFile } from '../../src/config';

test('Test Deposit getters/setters', async () => {
  const conf = await readFromFile('tests/config/files/config.test.json');
  const deposit = new Deposit();
  expect(deposit.srcChainId).toBe(undefined);
  expect(deposit.dstChainId).toBe(undefined);
  expect(deposit.bridge).toBe(undefined);
  expect(deposit.asset).toBe(undefined);
  expect(deposit.amount).toBe(undefined);
  expect(deposit.commitmentHash).toBe(undefined);
  expect(deposit.randomS).toBe(undefined);
  expect(deposit.hashK).toBe(undefined);
  expect(deposit.privateNote).toBe(undefined);
  expect(deposit.assetApproveTxHash).toBe(undefined);
  expect(deposit.getAssetApproveTxExplorerUrl(conf)).toBe(undefined);
  expect(deposit.srcTxHash).toBe(undefined);
  expect(deposit.getSrcTxExplorerUrl(conf)).toBe(undefined);
  expect(deposit.dstTxHash).toBe(undefined);
  expect(deposit.getDstTxExplorerUrl(conf)).toBe(undefined);
  expect(deposit.bridgeTxHash).toBe(undefined);
  expect(deposit.getBridgeTxExplorerUrl(conf)).toBe(undefined);
  expect(deposit.walletId).toBe(undefined);
  expect(deposit.srcAddress).toBe(undefined);
  expect(deposit.shieldedRecipientAddress).toBe(undefined);
  expect(deposit.status).toBe(undefined);
  expect(deposit.errorMessage).toBe(undefined);

  deposit.srcChainId = 1;
  expect(deposit.srcChainId).toBe(1);
  deposit.dstChainId = 56;
  expect(deposit.dstChainId).toBe(56);
  deposit.bridge = 'poly';
  expect(deposit.bridge).toBe('poly');
  deposit.asset = 'USDT';
  expect(deposit.asset).toBe('USDT');
  deposit.amount = new BN('deadbeef', 16);
  expect(toHexNoPrefix(deposit.amount)).toBe('deadbeef');
  deposit.commitmentHash = new BN('1243253475345437234563145234523452345');
  expect(deposit.commitmentHash.toString()).toBe('1243253475345437234563145234523452345');
  deposit.randomS = new BN('1243253475345437234563145234523452345');
  expect(deposit.randomS.toString()).toBe('1243253475345437234563145234523452345');
  deposit.hashK = new BN('1243253475345437234563145234523452345');
  expect(deposit.hashK.toString()).toBe('1243253475345437234563145234523452345');
  deposit.privateNote = toBuff('deaddead');
  expect(toHexNoPrefix(deposit.privateNote)).toBe('deaddead');
  deposit.assetApproveTxHash = '0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad';
  expect(deposit.assetApproveTxHash).toBe('0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad');
  expect(deposit.getAssetApproveTxExplorerUrl(conf)).toBe(
    'https://etherscan.io/tx/0x0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad',
  );
  deposit.srcTxHash = '8e25fd97c521cd6ca46f4f29b4ffeb4b85f31d71c30fd71ce0c2321042a1333f';
  expect(deposit.srcTxHash).toBe('8e25fd97c521cd6ca46f4f29b4ffeb4b85f31d71c30fd71ce0c2321042a1333f');
  expect(deposit.getSrcTxExplorerUrl(conf)).toBe(
    'https://etherscan.io/tx/0x8e25fd97c521cd6ca46f4f29b4ffeb4b85f31d71c30fd71ce0c2321042a1333f',
  );
  deposit.dstTxHash = '09b5cb62e9a9f54de8512f10c43f365202c4d65f13c880cd3e565c28a95068f3';
  expect(deposit.dstTxHash).toBe('09b5cb62e9a9f54de8512f10c43f365202c4d65f13c880cd3e565c28a95068f3');
  expect(deposit.getDstTxExplorerUrl(conf)).toBe(
    'https://bscscan.io/tx/0x09b5cb62e9a9f54de8512f10c43f365202c4d65f13c880cd3e565c28a95068f3',
  );
  deposit.bridgeTxHash = '9f44db5dfb792562db7a3e639087da520580e3499a73bef08a5cb764accde641';
  expect(deposit.bridgeTxHash).toBe('9f44db5dfb792562db7a3e639087da520580e3499a73bef08a5cb764accde641');
  expect(deposit.getBridgeTxExplorerUrl(conf)).toBe(
    'https://explorer.poly.network/testnet/tx/' +
      '9f44db5dfb792562db7a3e639087da520580e3499a73bef08a5cb764accde641',
  );
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
  deposit.errorMessage = 'error';
  expect(deposit.errorMessage).toBe('error');
});
