import { addPouchPlugin, getRxStoragePouch } from 'rxdb';
import { initDatabase, MystikoClientDatabase } from '../src';

test('test default parameters', async () => {
  const db: MystikoClientDatabase = await initDatabase();
  expect(db.name).toBe('mystiko-client-db');
  await db.destroy();
});

test('test parameters override', async () => {
  // eslint-disable-next-line global-require
  addPouchPlugin(require('pouchdb-adapter-memory'));
  const storage = getRxStoragePouch('memory');
  const db: MystikoClientDatabase = await initDatabase({
    name: 'mystiko-client-db-test',
    storage,
  });
  expect(db.name).toBe('mystiko-client-db-test');
  expect(db.storage).toBe(storage);
  await db.destroy();
});
