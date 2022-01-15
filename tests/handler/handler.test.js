import { Handler } from '../../src/handler/handler.js';
import { createDatabase } from '../../src/database.js';

test('Test Handler basic', async () => {
  expect(() => new Handler()).toThrow('db cannot be null or undefined');
  const db = await createDatabase('test.db');
  const handler = new Handler(db);
  expect(handler.db).toBe(db);
  expect(handler.options).not.toBe(undefined);
  expect(handler.options).not.toBe(null);
  db.database.close();
});

test('Test Handler saveDatabase', async () => {
  const db = await createDatabase('test.db');
  const handler = new Handler(db);
  const res = await handler.saveDatabase();
  expect(res).toBe(undefined);
  db.database.close();
});
