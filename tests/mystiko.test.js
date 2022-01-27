import mystiko from '../src/mystiko.js';
import { MystikoConfig } from '../src/config';
import DefaultTestnetConfigJson from '../config/default/testnet.json';
import DefaultMainnetConfigJson from '../config/default/mainnet.json';
const DefaultTestnetConfig = new MystikoConfig(DefaultTestnetConfigJson);
const DefaultMainnetConfig = new MystikoConfig(DefaultMainnetConfigJson);

test('test initialize', async () => {
  await mystiko.initialize({ isTestnet: true, conf: 'tests/config/files/config.test.json' });
  expect(mystiko.utils).not.toBe(undefined);
  expect(mystiko.models).not.toBe(undefined);
  expect(mystiko.ethers).not.toBe(undefined);
  expect(mystiko.config).not.toBe(undefined);
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
  expect(mystiko.logger).not.toBe(undefined);

  await mystiko.initialize({ isTestnet: false });
  expect(mystiko.config).toStrictEqual(DefaultMainnetConfig);
  await mystiko.initialize();
  expect(mystiko.config).toStrictEqual(DefaultTestnetConfig);
  await mystiko.initialize({ isTestnet: true, conf: DefaultTestnetConfig });
  expect(mystiko.config).toStrictEqual(DefaultTestnetConfig);
  await mystiko.initialize({ isTestnet: true, dbFile: 'test_file.db' });
  expect(mystiko.db).not.toBe(undefined);

  await expect(mystiko.initialize({ isTestnet: 'random' })).rejects.toThrow();
  await expect(mystiko.initialize({ conf: {} })).rejects.toThrow();
});
