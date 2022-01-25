import fs from 'fs';
import mystiko from '../src/index.js';

test('test basic', async () => {
  await mystiko.initialize();
  expect(fs.existsSync('db')).toBe(true);
  expect(fs.existsSync('db/mystiko_testnet.db')).toBe(true);
});
