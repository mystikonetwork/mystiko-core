import { Handler, createDatabase } from '../../src';

test('Test Handler basic', async () => {
  const db = await createDatabase('test.db');
  const handler = new Handler(db);
  expect(handler).not.toBe(undefined);
  db.database.close();
});

test('Test Handler saveDatabase', async () => {
  const db = await createDatabase('test.db');
  const handler = new Handler(db);
  const res = await handler.saveDatabase();
  expect(res).toBe(undefined);
  db.database.close();
});
