import { Handler } from '../../src/handler/handler.js';
import { createDatabase } from '../../src/database.js';

test('Test Handler basic', async () => {
  expect(() => new Handler()).toThrow('db cannot be null or undefined');
  const db = await createDatabase('test.db', true);
  const handler = new Handler(db);
  expect(handler.db).toBe(db);
  expect(handler.options).not.toBe(undefined);
  expect(handler.options).not.toBe(null);
  db.database.close();
});

test('Test Handler saveDatabase', async () => {
  const db = await createDatabase('test.db', true);
  const handler = new Handler(db);
  const res = await handler.saveDatabase();
  expect(res).toBe(undefined);
  db.database.close();
});

test('Test Handler AES encrypt/derypt', () => {
  const data = 'Mystiko is awesome';
  const encrypted = Handler.aesEncrypt(data, 'P@ssw0rd');
  const decrypted = Handler.aesDecrypt(encrypted, 'P@ssw0rd');
  expect(decrypted).toBe(data);
  expect(Handler.aesDecrypt(encrypted, 'wrongPassword')).not.toBe('data');
});

test('Test Handler hmacSHA512', () => {
  const data = 'Mystiko is awesome';
  const salt = 'P@ssw0rd';
  expect(Handler.hmacSHA512(data, salt)).toBe(
    '03b41505aa26437d94831f9bfd24afd4e7eaf33d6aaf368d0' +
      'c77545ad2a958024222badb4d84a17f84ff15297e16199dab' +
      'c88b417ce764624ed5a2443681afcd',
  );
  expect(Handler.hmacSHA512(data)).toBe(
    'db3c4095645e61571b2994839bd19d61a3087e5f6d864c446' +
      '96f70058c2db602adbd2bf66d987b9f7e25006e99561eeb7d' +
      '2cbd960663701268cb5a45b300e4b0',
  );
});
