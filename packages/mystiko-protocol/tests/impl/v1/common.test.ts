import { toBN, toBuff, toDecimals, toHex } from '@mystiko/utils';
import { FIELD_SIZE, v1Protocol } from '../../../src';

test('test randomBigInt', () => {
  const int1 = v1Protocol.randomBigInt(8);
  expect(int1.lt(FIELD_SIZE)).toBe(true);
  const int2 = v1Protocol.randomBigInt(16);
  expect(int2.lt(FIELD_SIZE)).toBe(true);
  const int3 = v1Protocol.randomBigInt();
  expect(int3.lt(FIELD_SIZE)).toBe(true);
  for (let i = 0; i < 100; i += 1) {
    const bgInt = v1Protocol.randomBigInt();
    expect(bgInt.lt(FIELD_SIZE)).toBe(true);
  }
});

test('test randomBytes', () => {
  const bytes1 = v1Protocol.randomBytes();
  expect(bytes1.length).toBe(32);
  const bytes2 = v1Protocol.randomBytes(16);
  expect(bytes2.length).toBe(16);
  const bytes3 = v1Protocol.randomBytes(1);
  expect(bytes3.length).toBe(1);
});

test('test buffToBigInt', () => {
  const buff = toBuff('baadbeef');
  expect(v1Protocol.buffToBigInt(buff).toString()).toBe('4022250938');
});

test('test bigIntToBuff', () => {
  expect(() => v1Protocol.bigIntToBuff(toBN(4022250938), 1)).toThrow();
  expect(v1Protocol.bigIntToBuff(toBN(4022250938), 4).toString('hex')).toBe('baadbeef');
  expect(v1Protocol.bigIntToBuff(toBN(4022250938), 6).toString('hex')).toBe('baadbeef0000');
});

test('test secretKeyForVerification', () => {
  expect(() => v1Protocol.secretKeyForVerification(toBuff('baadbeef'))).toThrow();
  for (let i = 0; i < 10; i += 1) {
    const rawSecretKey = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
    const sk = v1Protocol.secretKeyForVerification(rawSecretKey);
    expect(sk.length).toBe(v1Protocol.VERIFY_SK_SIZE);
  }
});

test('test publicKeyForVerification', () => {
  expect(() => v1Protocol.publicKeyForVerification(toBuff('baadbeef'))).toThrow();
  for (let i = 0; i < 10; i += 1) {
    const rawSecretKey = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
    const pk = v1Protocol.publicKeyForVerification(rawSecretKey);
    expect(pk.length).toBe(v1Protocol.VERIFY_PK_SIZE);
  }
});

test('test secretKeyForEncryption', () => {
  expect(() => v1Protocol.secretKeyForEncryption(toBuff('baadbeef'))).toThrow();
  const rawSecretKey = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const sk = v1Protocol.secretKeyForVerification(rawSecretKey);
  expect(sk.length).toBe(v1Protocol.ENCRYPT_SK_SIZE);
});

test('test publicKeyForEncryption', () => {
  expect(() => v1Protocol.publicKeyForEncryption(toBuff('baadbeef'))).toThrow();
  const rawSecretKey = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const pk = v1Protocol.publicKeyForEncryption(rawSecretKey);
  expect(pk.length).toBe(v1Protocol.ENCRYPT_PK_SIZE);
});

test('test fullPublicKey', () => {
  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const pkVerify = v1Protocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = v1Protocol.publicKeyForEncryption(rawSkEnc);
  expect(() => v1Protocol.fullPublicKey(pkVerify, toBuff('baadbeef'))).toThrow();
  expect(() => v1Protocol.fullPublicKey(toBuff('baadbeef'), pkEnc)).toThrow();
  const fullPublicKey = v1Protocol.fullPublicKey(pkVerify, pkEnc);
  expect(fullPublicKey.length).toBe(v1Protocol.VERIFY_PK_SIZE + v1Protocol.ENCRYPT_PK_SIZE);
});

test('test fullSecretKey', () => {
  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const skVerify = v1Protocol.secretKeyForVerification(rawSkVerify);
  const skEnc = v1Protocol.secretKeyForEncryption(rawSkEnc);
  expect(() => v1Protocol.fullSecretKey(skVerify, toBuff('baadbeef'))).toThrow();
  expect(() => v1Protocol.fullSecretKey(toBuff('baadbeef'), skEnc)).toThrow();
  const fullSecretKey = v1Protocol.fullSecretKey(skVerify, skEnc);
  expect(fullSecretKey.length).toBe(v1Protocol.VERIFY_SK_SIZE + v1Protocol.ENCRYPT_SK_SIZE);
});

test('test separatedPublicKeys', () => {
  expect(() => v1Protocol.separatedPublicKeys(toBuff('baadbeef'))).toThrow();
  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const pkVerify = v1Protocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = v1Protocol.publicKeyForEncryption(rawSkEnc);
  const fullPublicKey = v1Protocol.fullPublicKey(pkVerify, pkEnc);
  const keys = v1Protocol.separatedPublicKeys(fullPublicKey);
  expect(toHex(keys.pkVerify)).toBe(toHex(pkVerify));
  expect(toHex(keys.pkEnc)).toBe(toHex(pkEnc));
});

test('test separatedSecretKeys', () => {
  expect(() => v1Protocol.separatedSecretKeys(toBuff('baadbeef'))).toThrow();
  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const skVerify = v1Protocol.secretKeyForVerification(rawSkVerify);
  const skEnc = v1Protocol.secretKeyForEncryption(rawSkEnc);
  const fullSecretKey = v1Protocol.fullSecretKey(skVerify, skEnc);
  const keys = v1Protocol.separatedSecretKeys(fullSecretKey);
  expect(toHex(keys.skVerify)).toBe(toHex(skVerify));
  expect(toHex(keys.skEnc)).toBe(toHex(skEnc));
});

test('test shieldedAddress', () => {
  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const pkVerify = v1Protocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = v1Protocol.publicKeyForEncryption(rawSkEnc);
  const shieldedAddress = v1Protocol.shieldedAddress(pkVerify, pkEnc);
  expect(v1Protocol.isShieldedAddress(shieldedAddress)).toBe(true);
  const keys = v1Protocol.publicKeysFromShieldedAddress(shieldedAddress);
  expect(toHex(keys.pkVerify)).toBe(toHex(pkVerify));
  expect(toHex(keys.pkEnc)).toBe(toHex(pkEnc));
});

test('test isShieldedAddress', () => {
  expect(v1Protocol.isShieldedAddress('')).toBe(false);
  expect(v1Protocol.isShieldedAddress('axeddd#$')).toBe(false);
});

test('test asymmetric encryption/decryption', async () => {
  const rawSecretKey = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const sk = v1Protocol.secretKeyForEncryption(rawSecretKey);
  const pk = v1Protocol.publicKeyForEncryption(rawSecretKey);
  const data = toBuff('baadbeefdeadbeef');
  const encryptedData = await v1Protocol.encryptAsymmetric(pk, data);
  const decryptedData = await v1Protocol.decryptAsymmetric(sk, encryptedData);
  expect(toHex(decryptedData)).toBe(toHex(data));
});

test('test symmetric encryption/decryption', () => {
  const plainText = 'mystiko is awesome';
  const cipherText = v1Protocol.encryptSymmetric('P@ssw0rd', plainText);
  expect(v1Protocol.decryptSymmetric('P@ssw0rd', cipherText)).toBe(plainText);
});

test('test sha256', () => {
  const data1 = toBuff('baad');
  const data2 = toBuff('beef');
  const data3 = toBuff('baad');
  const hash1 = v1Protocol.sha256([data1]);
  const hash2 = v1Protocol.sha256([data2]);
  const hash3 = v1Protocol.sha256([data3]);
  expect(toHex(hash1)).not.toBe(toHex(hash2));
  expect(toHex(hash1)).toBe(toHex(hash3));
});

test('test poseidonHash', () => {
  const h1 = v1Protocol.poseidonHash([toBN(1), toBN(2)]);
  const h2 = v1Protocol.poseidonHash([toBN(3), toBN(4)]);
  const h3 = v1Protocol.poseidonHash([toBN(1), toBN(2)]);
  expect(h1.toString()).toBe(h3.toString());
  expect(h2.toString()).not.toBe(h3.toString());
});

test('test checksum', () => {
  const hash1 = v1Protocol.checkSum('hello world');
  const hash2 = v1Protocol.checkSum('Mystiko is awesome', '');
  const hash3 = v1Protocol.checkSum('Mystiko is awesome', 'P@ssw0rd');
  const hash4 = v1Protocol.checkSum('hello world');
  expect(hash1).not.toBe(hash2);
  expect(hash2).not.toBe(hash3);
  expect(hash4).toBe(hash1);
  expect(hash3).toBe(
    '03b41505aa26437d94831f9bfd24afd4e7eaf33d6aaf368d0' +
      'c77545ad2a958024222badb4d84a17f84ff15297e16199dab' +
      'c88b417ce764624ed5a2443681afcd',
  );
  expect(hash2).toBe(
    '8b9fb4d5f890ea83d09f63af9dee5ba8a53a9f5dedeb9bfd0e6e' +
      'd135d5dca7abbc75d455fe0ee46040828834186543e008401238aeaaab1039f3a5ab37bb1c97',
  );
});

test('test commitment', async () => {
  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const pkVerify = v1Protocol.publicKeyForVerification(rawSkVerify);
  const skEnc = v1Protocol.secretKeyForEncryption(rawSkEnc);
  const pkEnc = v1Protocol.publicKeyForEncryption(rawSkEnc);
  const amount = toDecimals(100, 18);
  const { commitmentHash, privateNote, k, randomS } = await v1Protocol.commitment(pkVerify, pkEnc, amount);
  expect(commitmentHash).not.toBe(undefined);
  expect(privateNote).not.toBe(undefined);
  expect(k).not.toBe(undefined);
  expect(randomS).not.toBe(undefined);
  const decryptedNote = await v1Protocol.decryptAsymmetric(skEnc, privateNote);
  expect(decryptedNote.length).toBe(v1Protocol.RANDOM_SK_SIZE * 3);
});

test('test commitmentWithShieldedAddress', async () => {
  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const pkVerify = v1Protocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = v1Protocol.publicKeyForEncryption(rawSkEnc);
  const shieldedAddress = v1Protocol.shieldedAddress(pkVerify, pkEnc);
  const { commitmentHash, privateNote } = await v1Protocol.commitmentWithShieldedAddress(
    shieldedAddress,
    toBN(1),
  );
  expect(commitmentHash).not.toBe(undefined);
  expect(privateNote).not.toBe(undefined);
});

test('test serialNumber', () => {
  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
  const skVerify = v1Protocol.secretKeyForVerification(rawSkVerify);
  const randomP = v1Protocol.randomBigInt(v1Protocol.RANDOM_SK_SIZE);
  const serialNumber = v1Protocol.serialNumber(skVerify, randomP);
  expect(serialNumber).not.toBe(undefined);
});
