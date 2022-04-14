import { MystikoProtocol } from '@mystikonetwork/protocol';
import { initDatabase, MystikoDatabase, Wallet } from '../src';
import { createProtocol } from './common';

let db: MystikoDatabase;
let protocol: MystikoProtocol;

beforeAll(async () => {
  db = await initDatabase();
  protocol = await createProtocol();
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
    encryptedMasterSeed: protocol.encryptSymmetric('P@ssw0rd', 'deadbeef'),
    accountNonce: 1,
  });
  expect(wallet.id).toBe('1');
  expect(wallet.hashedPassword).toBe('deadbeef');
  expect(wallet.masterSeed(protocol, 'P@ssw0rd')).toBe('deadbeef');
  expect(wallet.accountNonce).toBe(1);
  await expect(
    db.wallets.insert({
      id: '1',
      hashedPassword: 'deadbeef',
      encryptedMasterSeed: protocol.encryptSymmetric('P@ssw0rd', 'deadbeef'),
      accountNonce: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  ).rejects.toThrow();
  await expect(
    db.wallets.insert({
      id: '2',
      hashedPassword: 'deadbeef',
      encryptedMasterSeed: protocol.encryptSymmetric('P@ssw0rd', 'deadbeef'),
      accountNonce: -1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  ).rejects.toThrow();
  await expect(
    db.wallets.insert({
      id: '2',
      hashedPassword: 'YYYYY',
      encryptedMasterSeed: protocol.encryptSymmetric('P@ssw0rd', 'deadbeef'),
      accountNonce: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  ).rejects.toThrow();
});
