import fs from 'fs';
import mystiko, { DefaultTestnetConfig, DefaultMainnetConfig } from '../src/node';

test('test initialize', async () => {
  await mystiko.initialize();
  expect(mystiko.config).toStrictEqual(DefaultTestnetConfig);
  expect(fs.existsSync('db/mystiko_testnet.db')).toBe(true);
  mystiko.db.database.close();
  await mystiko.initialize({ isTestnet: false });
  expect(mystiko.config).toStrictEqual(DefaultMainnetConfig);
  expect(fs.existsSync('db/mystiko.db')).toBe(true);
  mystiko.db.database.close();
  await mystiko.initialize({ isTestnet: true });
  expect(mystiko.config).toStrictEqual(DefaultTestnetConfig);
  mystiko.db.database.close();
  const tempDir = fs.mkdtempSync('indexTest');
  await mystiko.initialize({ dbFile: `${tempDir}/mystiko.db` });
  expect(fs.existsSync(`${tempDir}/mystiko.db`)).toBe(true);
  fs.rmdirSync(tempDir, { recursive: true });
  mystiko.db.database.close();
});