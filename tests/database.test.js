import fs from 'fs';
import os from 'os';
import path from 'path';
import { createDatabase } from '../src/database.js';

test('Test persist database', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbtest'));
  const db = await createDatabase(tmpDir + '/mystiko.db', false);
  expect(db.accounts).not.toBe(null);
  expect(db.wallets).not.toBe(null);
  expect(db.notes).not.toBe(null);
  expect(db.deposits).not.toBe(null);
  expect(db.withdraws).not.toBe(null);
  expect(db.database).not.toBe(null);
  db.accounts.insert({ address: '783323' });
  expect(db.accounts.find().length).toBe(1);
  db.database.close(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });
});

test('Test in-memory database', async () => {
  const db = await createDatabase('mystiko.db', true);
  expect(db.accounts).not.toBe(null);
  expect(db.wallets).not.toBe(null);
  expect(db.notes).not.toBe(null);
  expect(db.deposits).not.toBe(null);
  expect(db.withdraws).not.toBe(null);
  expect(db.database).not.toBe(null);
  db.accounts.insert({ address: '783323' });
  expect(db.accounts.find().length).toBe(1);
  db.database.close();
});
