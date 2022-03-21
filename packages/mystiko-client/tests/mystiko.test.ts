import { ethers } from 'ethers';
import { DefaultClientTestnetConfig, DefaultClientMainnetConfig } from '@mystikonetwork/config';
import { ProviderFactory } from '@mystikonetwork/utils';
import { Mystiko } from '../src';

test('test initialize', async () => {
  const mystiko = new Mystiko();
  await mystiko.initialize({ isTestnet: true, conf: 'tests/config/config.test.json' });
  expect(mystiko.utils).not.toBe(undefined);
  expect(mystiko.models).not.toBe(undefined);
  expect(mystiko.config).not.toBe(undefined);
  expect(mystiko.db).not.toBe(undefined);
  expect(mystiko.db.adapter).toBe(undefined);
  expect(mystiko.db.exportDataAsString).not.toBe(undefined);
  expect(mystiko.db.importDataFromJson).not.toBe(undefined);
  expect(mystiko.db.importDataFromJsonFile).not.toBe(undefined);
  expect(mystiko.wallets).not.toBe(undefined);
  expect(mystiko.accounts).not.toBe(undefined);
  expect(mystiko.deposits).not.toBe(undefined);
  expect(mystiko.contracts).not.toBe(undefined);
  expect(mystiko.events).not.toBe(undefined);
  expect(mystiko.providers).not.toBe(undefined);
  expect(mystiko.contractPool).not.toBe(undefined);
  expect(mystiko.notes).not.toBe(undefined);
  expect(mystiko.withdraws).not.toBe(undefined);
  expect(mystiko.signers).not.toBe(undefined);
  expect(mystiko.signers?.metaMask).not.toBe(undefined);
  expect(mystiko.sync).not.toBe(undefined);
  expect(mystiko.logger).not.toBe(undefined);

  await mystiko.initialize({
    isTestnet: true,
    dbFile: 'test_file.db',
    conf: 'tests/config/config.test.json',
  });
  expect(mystiko.db).not.toBe(undefined);
  await mystiko.initialize({ isTestnet: false, conf: 'tests/config/config.test.json' });
  expect(mystiko.db).not.toBe(undefined);
  const providerFactory: ProviderFactory = {
    createProvider: (connections) => new ethers.providers.JsonRpcProvider(connections[0]),
  };
  await mystiko.initialize({ providerFactory });
  expect(mystiko.config).toStrictEqual(DefaultClientTestnetConfig);
  await mystiko.initialize({ isTestnet: false, providerFactory });
  expect(mystiko.config).toStrictEqual(DefaultClientMainnetConfig);
});
