import fs from 'fs';
import mystiko from '../src/index.js';

test('test basic', async () => {
  await mystiko.initialize({ dbAdapter: undefined });
  expect(fs.existsSync('db')).toBe(true);
});
