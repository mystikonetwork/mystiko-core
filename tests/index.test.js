import mystiko from '../src/index.js';
import { DefaultTestnetConfig, DefaultMainnetConfig } from '../src/config';

test('test initialize', async () => {
  await mystiko.initialize(true, 'tests/config/files/config.test.json');
  expect(mystiko.utils).not.toBe(undefined);
  expect(mystiko.models).not.toBe(undefined);
  expect(mystiko.ethers).not.toBe(undefined);
  expect(mystiko.conf).not.toBe(undefined);
  expect(mystiko.db).not.toBe(undefined);
  expect(mystiko.db.adapter).toBe(undefined);
  expect(mystiko.wallets).not.toBe(undefined);
  expect(mystiko.accounts).not.toBe(undefined);
  expect(mystiko.deposits).not.toBe(undefined);
  expect(mystiko.providers).not.toBe(undefined);
  expect(mystiko.contracts).not.toBe(undefined);
  expect(mystiko.notes).not.toBe(undefined);
  expect(mystiko.withdraws).not.toBe(undefined);
  expect(mystiko.signers).not.toBe(undefined);
  expect(mystiko.signers.metaMask).not.toBe(undefined);

  await mystiko.initialize(false);
  expect(mystiko.conf).toBe(DefaultMainnetConfig);
  await mystiko.initialize(true);
  expect(mystiko.conf).toBe(DefaultTestnetConfig);
  await mystiko.initialize(true, DefaultTestnetConfig);
  expect(mystiko.conf).toBe(DefaultTestnetConfig);
  await mystiko.initialize(true, undefined, 'test_file.db');
  expect(mystiko.db).not.toBe(undefined);

  await expect(mystiko.initialize('random')).rejects.toThrow();
  await expect(mystiko.initialize(false, {})).rejects.toThrow();
});
