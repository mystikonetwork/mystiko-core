import { MystikoProtocol } from '@mystikonetwork/protocol';
import { toHexNoPrefix } from '@mystikonetwork/utils';
import { createProtocol } from './common';
import { AccountStatus, initDatabase, MystikoDatabase } from '../src';

let db: MystikoDatabase;
let protocol: MystikoProtocol;

function generateKeys(password: string): {
  rawSkVerify: Buffer;
  rawSkEnc: Buffer;
  pkVerify: Buffer;
  pkEnc: Buffer;
  publicKey: string;
  encryptedSecretKey: string;
} {
  const rawSkVerify = protocol.randomBytes();
  const rawSkEnc = protocol.randomBytes();
  const pkVerify = protocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = protocol.publicKeyForEncryption(rawSkEnc);
  const publicKey = protocol.fullPublicKey(pkVerify, pkEnc);
  const secretKey = protocol.fullSecretKey(rawSkVerify, rawSkEnc);
  const encryptedSecretKey = protocol.encryptSymmetric(password, toHexNoPrefix(secretKey));
  return { rawSkVerify, rawSkEnc, pkVerify, pkEnc, publicKey: toHexNoPrefix(publicKey), encryptedSecretKey };
}

beforeAll(async () => {
  protocol = await createProtocol();
});

beforeEach(async () => {
  db = await initDatabase();
});

afterEach(async () => {
  await db.remove();
});

test('test insert', async () => {
  const password = 'P@ssw0rd';
  const keys = generateKeys(password);
  const now = new Date().toISOString();
  await db.wallets.insert({
    id: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hashedPassword: 'deadbeef',
    encryptedMasterSeed: 'deadbeef',
    accountNonce: 1,
  });
  await db.accounts.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    name: 'account 1',
    shieldedAddress: protocol.shieldedAddress(keys.pkVerify, keys.pkEnc),
    publicKey: keys.publicKey,
    encryptedSecretKey: keys.encryptedSecretKey,
    status: AccountStatus.SCANNED,
    scanSize: 10000,
    scannedCommitmentId: '1234',
    wallet: '1',
  });
  const account = await db.accounts.findOne('1').exec();
  if (account != null) {
    expect(account.id).toBe('1');
    expect(account.createdAt).toBe(now);
    expect(account.updatedAt).toBe(now);
    expect(account.name).toBe('account 1');
    expect(account.shieldedAddress).toBe(protocol.shieldedAddress(keys.pkVerify, keys.pkEnc));
    expect(account.publicKey).toBe(keys.publicKey);
    expect(account.encryptedSecretKey).toBe(keys.encryptedSecretKey);
    expect(account.scanSize).toBe(10000);
    expect(account.scannedCommitmentId).toBe('1234');
    expect(account.wallet).toBe('1');
    expect(toHexNoPrefix(account.publicKeyForVerification(protocol))).toBe(toHexNoPrefix(keys.pkVerify));
    expect(toHexNoPrefix(account.publicKeyForEncryption(protocol))).toBe(toHexNoPrefix(keys.pkEnc));
    expect(account.secretKey(protocol, password)).toBe(
      toHexNoPrefix(protocol.fullSecretKey(keys.rawSkVerify, keys.rawSkEnc)),
    );
    expect(toHexNoPrefix(account.secretKeyForVerification(protocol, password))).toBe(
      toHexNoPrefix(keys.rawSkVerify),
    );
    expect(toHexNoPrefix(account.secretKeyForEncryption(protocol, password))).toBe(
      toHexNoPrefix(keys.rawSkEnc),
    );
    expect((await account.populate('wallet')).id).toBe('1');
  } else {
    throw new Error('failed to get account');
  }
});

test('test collection clear', async () => {
  const password = 'P@ssw0rd';
  const keys = generateKeys(password);
  const now = new Date().toISOString();
  await db.accounts.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    name: 'account 1',
    shieldedAddress: protocol.shieldedAddress(keys.pkVerify, keys.pkEnc),
    publicKey: keys.publicKey,
    encryptedSecretKey: keys.encryptedSecretKey,
    status: AccountStatus.CREATED,
    scanSize: 20000,
    scannedCommitmentId: '1234',
    wallet: '1',
  });
  expect(await db.accounts.findOne().exec()).not.toBe(null);
  await db.accounts.clear();
  expect(await db.accounts.findOne().exec()).toBe(null);
});
