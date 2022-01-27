import fs from 'fs';
import os from 'os';
import path from 'path';
import { createDatabase, exportDataAsString, importDataFromJsonFile } from '../src/database.js';

test('Test persist database', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbtest'));
  const LokiFsStructuredAdapter = await import('lokijs/src/loki-fs-structured-adapter.js');
  const adapter = new LokiFsStructuredAdapter.default();
  const db = await createDatabase(tmpDir + '/mystiko.db', adapter);
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
  const db = await createDatabase('mystiko.db');
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

test('Test export/import data', async () => {
  const db = await createDatabase('mystiko.db');
  db.accounts.insert({ name: 'test account 1' });
  db.wallets.insert({ accountNonce: 1 });
  db.notes.insert({ srcChainId: 1 });
  db.deposits.insert({ srcChainId: 10 });
  db.withdraws.insert({ chainId: 100 });
  const json = exportDataAsString(db);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbtest'));
  fs.writeFileSync(tmpDir + '/export.json', json);
  await importDataFromJsonFile(db, tmpDir + '/export.json');
  expect(db.wallets.findOne().accountNonce).toBe(1);
  expect(db.accounts.findOne().name).toBe('test account 1');
  expect(db.notes.findOne().srcChainId).toBe(1);
  expect(db.deposits.findOne().srcChainId).toBe(10);
  expect(db.withdraws.findOne().chainId).toBe(100);
  db.database.close(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });
});
