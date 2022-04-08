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
    hashedPassword: 'abcdef',
    encryptedMasterSeed: 'deadbeef',
    accountNonce: 1,
  });
  expect(wallet.id).toBe('1');
  expect(wallet.hashedPassword).toBe('abcdef');
  expect(wallet.encryptedMasterSeed).toBe('deadbeef');
  expect(wallet.accountNonce).toBe(1);
  await expect(
    db.wallets.insert({
      id: '1',
      hashedPassword: 'abcdef',
      encryptedMasterSeed: 'deadbeef',
      accountNonce: 1,
    }),
  ).rejects.toThrow();
  await expect(
    db.wallets.insert({
      id: '2',
      hashedPassword: 'abcdef',
      encryptedMasterSeed: 'deadbeef',
      accountNonce: -1,
    }),
  ).rejects.toThrow();
});
