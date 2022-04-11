import { initDatabase, MystikoClientDatabase, Wallet } from '../src';

let db: MystikoClientDatabase;

beforeAll(async () => {
  db = await initDatabase();
});

afterAll(async () => {
  await db.destroy();
});

test('test insert', async () => {
  const wallet: Wallet = await db.wallets.insert({
    id: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hashedPassword: 'deadbeef',
    encryptedMasterSeed: 'deadbeef',
    accountNonce: 1,
  });
  expect(wallet.id).toBe('1');
  expect(wallet.hashedPassword).toBe('deadbeef');
  expect(wallet.encryptedMasterSeed).toBe('deadbeef');
  expect(wallet.accountNonce).toBe(1);
  await expect(
    db.wallets.insert({
      id: '1',
      hashedPassword: 'deadbeef',
      encryptedMasterSeed: 'deadbeef',
      accountNonce: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  ).rejects.toThrow();
  await expect(
    db.wallets.insert({
      id: '2',
      hashedPassword: 'deadbeef',
      encryptedMasterSeed: 'deadbeef',
      accountNonce: -1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  ).rejects.toThrow();
  await expect(
    db.wallets.insert({
      id: '2',
      hashedPassword: 'YYYYY',
      encryptedMasterSeed: 'deadbeef',
      accountNonce: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  ).rejects.toThrow();
});
