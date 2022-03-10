import { ethers } from 'ethers';
import fs from 'fs';
import { ProviderFactory } from '@mystiko/utils';
import mystiko, { DefaultTestnetConfig, DefaultMainnetConfig } from '../src/node';

test('test initialize', async () => {
  const providerFactory: ProviderFactory = {
    createProvider: (connections) => new ethers.providers.JsonRpcProvider(connections[0]),
  };
  await mystiko.initialize({ providerFactory });
  expect(mystiko.config).toStrictEqual(DefaultTestnetConfig);
  expect(fs.existsSync('db/mystiko_testnet.db')).toBe(true);
  mystiko.db.database.close();
  await mystiko.initialize({ isTestnet: false, providerFactory });
  expect(mystiko.config).toStrictEqual(DefaultMainnetConfig);
  expect(fs.existsSync('db/mystiko.db')).toBe(true);
  mystiko.db.database.close();
  await mystiko.initialize({ isTestnet: true, providerFactory });
  expect(mystiko.config).toStrictEqual(DefaultTestnetConfig);
  mystiko.db.database.close();
  const tempDir = fs.mkdtempSync('indexTest');
  await mystiko.initialize({ dbFile: `${tempDir}/mystiko.db`, providerFactory });
  expect(fs.existsSync(`${tempDir}/mystiko.db`)).toBe(true);
  fs.rmdirSync(tempDir, { recursive: true });
  mystiko.db.database.close();
});
