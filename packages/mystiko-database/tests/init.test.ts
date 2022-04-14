import { addPouchPlugin, getRxStoragePouch } from 'rxdb';
import { initDatabase, MystikoDatabase } from '../src';

test('test default parameters', async () => {
  const db: MystikoDatabase = await initDatabase();
  expect(db.name).toBe('mystiko-client-db');
  await db.destroy();
});

test('test parameters override', async () => {
  // eslint-disable-next-line global-require
  addPouchPlugin(require('pouchdb-adapter-memory'));
  const storage = getRxStoragePouch('memory');
  const db: MystikoDatabase = await initDatabase({
    name: 'mystiko-client-db-test',
    storage,
  });
  expect(db.name).toBe('mystiko-client-db-test');
  expect(db.storage).toBe(storage);
  await db.destroy();
});
