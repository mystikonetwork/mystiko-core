import BN from 'bn.js';
import * as DefaultProtocol from '../../src/protocol/default.js';
import { toHex, toBuff, toDecimals } from '../../src/utils.js';

test('test randomBigInt', () => {
  const int1 = DefaultProtocol.randomBigInt(8);
  expect(int1.lt(DefaultProtocol.FIELD_SIZE)).toBe(true);
  const int2 = DefaultProtocol.randomBigInt(16);
  expect(int2.lt(DefaultProtocol.FIELD_SIZE)).toBe(true);
  const int3 = DefaultProtocol.randomBigInt();
  expect(int3.lt(DefaultProtocol.FIELD_SIZE)).toBe(true);
  for (let i = 0; i < 100; i++) {
    const bgInt = DefaultProtocol.randomBigInt();
    expect(bgInt.lt(DefaultProtocol.FIELD_SIZE)).toBe(true);
  }
});

test('test randomBytes', () => {
  const bytes1 = DefaultProtocol.randomBytes();
  expect(bytes1.length).toBe(32);
  const bytes2 = DefaultProtocol.randomBytes(16);
  expect(bytes2.length).toBe(16);
  const bytes3 = DefaultProtocol.randomBytes(1);
  expect(bytes3.length).toBe(1);
});

test('test buffToBigInt', () => {
  expect(() => DefaultProtocol.buffToBigInt('baadbeef')).toThrow();
  const buff = toBuff('baadbeef');
  expect(DefaultProtocol.buffToBigInt(buff).toString()).toBe('4022250938');
});

test('test bigIntToBuff', () => {
  expect(() => DefaultProtocol.bigIntToBuff(1234)).toThrow();
  expect(() => DefaultProtocol.bigIntToBuff(new BN(4022250938), 1)).toThrow();
  expect(DefaultProtocol.bigIntToBuff(new BN(4022250938), 4).toString('hex')).toBe('baadbeef');
  expect(DefaultProtocol.bigIntToBuff(new BN(4022250938), 6).toString('hex')).toBe('baadbeef0000');
});

test('test secretKeyForVerification', () => {
  expect(() => DefaultProtocol.secretKeyForVerification('baadbeef')).toThrow();
  expect(() => DefaultProtocol.secretKeyForVerification(toBuff('baadbeef'))).toThrow();
  for (let i = 0; i < 10; i++) {
    const rawSecretKey = DefaultProtocol.randomBytes(DefaultProtocol.VERIFY_SK_SIZE);
    const sk = DefaultProtocol.secretKeyForVerification(rawSecretKey);
    expect(sk.length).toBe(DefaultProtocol.VERIFY_SK_SIZE);
  }
});

test('test publicKeyForVerification', () => {
  expect(() => DefaultProtocol.publicKeyForVerification('baadbeef')).toThrow();
  expect(() => DefaultProtocol.publicKeyForVerification(toBuff('baadbeef'))).toThrow();
  for (let i = 0; i < 10; i++) {
    const rawSecretKey = DefaultProtocol.randomBytes(DefaultProtocol.VERIFY_SK_SIZE);
    const pk = DefaultProtocol.publicKeyForVerification(rawSecretKey);
    expect(pk.length).toBe(DefaultProtocol.VERIFY_PK_SIZE);
  }
});

test('test secretKeyForEncryption', () => {
  expect(() => DefaultProtocol.secretKeyForEncryption('baadbeef')).toThrow();
  expect(() => DefaultProtocol.secretKeyForEncryption(toBuff('baadbeef'))).toThrow();
  const rawSecretKey = DefaultProtocol.randomBytes(DefaultProtocol.ENCRYPT_SK_SIZE);
  const sk = DefaultProtocol.secretKeyForVerification(rawSecretKey);
  expect(sk.length).toBe(DefaultProtocol.ENCRYPT_SK_SIZE);
});

test('test publicKeyForEncryption', () => {
  expect(() => DefaultProtocol.publicKeyForEncryption('baadbeef')).toThrow();
  expect(() => DefaultProtocol.publicKeyForEncryption(toBuff('baadbeef'))).toThrow();
  const rawSecretKey = DefaultProtocol.randomBytes(DefaultProtocol.ENCRYPT_SK_SIZE);
  const pk = DefaultProtocol.publicKeyForEncryption(rawSecretKey);
  expect(pk.length).toBe(DefaultProtocol.ENCRYPT_PK_SIZE);
});

test('test fullPublicKey', () => {
  expect(() => DefaultProtocol.fullPublicKey('baadbeef', toBuff('baadbeef'))).toThrow();
  expect(() => DefaultProtocol.fullPublicKey(toBuff('baadbeef'), 'baadbeef')).toThrow();
  const rawSkVerify = DefaultProtocol.randomBytes(DefaultProtocol.VERIFY_SK_SIZE);
  const rawSkEnc = DefaultProtocol.randomBytes(DefaultProtocol.ENCRYPT_SK_SIZE);
  const pkVerify = DefaultProtocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = DefaultProtocol.publicKeyForEncryption(rawSkEnc);
  expect(() => DefaultProtocol.fullPublicKey(pkVerify, toBuff('baadbeef'))).toThrow();
  expect(() => DefaultProtocol.fullPublicKey(toBuff('baadbeef'), pkEnc)).toThrow();
  const fullPublicKey = DefaultProtocol.fullPublicKey(pkVerify, pkEnc);
  expect(fullPublicKey.length).toBe(DefaultProtocol.VERIFY_PK_SIZE + DefaultProtocol.ENCRYPT_PK_SIZE);
});

test('test fullSecretKey', () => {
  expect(() => DefaultProtocol.fullSecretKey('baadbeef', toBuff('baadbeef'))).toThrow();
  expect(() => DefaultProtocol.fullSecretKey(toBuff('baadbeef'), 'baadbeef')).toThrow();
  const rawSkVerify = DefaultProtocol.randomBytes(DefaultProtocol.VERIFY_SK_SIZE);
  const rawSkEnc = DefaultProtocol.randomBytes(DefaultProtocol.ENCRYPT_SK_SIZE);
  const skVerify = DefaultProtocol.secretKeyForVerification(rawSkVerify);
  const skEnc = DefaultProtocol.secretKeyForEncryption(rawSkEnc);
  expect(() => DefaultProtocol.fullSecretKey(skVerify, toBuff('baadbeef'))).toThrow();
  expect(() => DefaultProtocol.fullSecretKey(toBuff('baadbeef'), skEnc)).toThrow();
  const fullSecretKey = DefaultProtocol.fullSecretKey(skVerify, skEnc);
  expect(fullSecretKey.length).toBe(DefaultProtocol.VERIFY_SK_SIZE + DefaultProtocol.ENCRYPT_SK_SIZE);
});

test('test separatedPublicKeys', () => {
  expect(() => DefaultProtocol.separatedPublicKeys('baadbeef')).toThrow();
  expect(() => DefaultProtocol.separatedPublicKeys(toBuff('baadbeef'))).toThrow();
  const rawSkVerify = DefaultProtocol.randomBytes(DefaultProtocol.VERIFY_SK_SIZE);
  const rawSkEnc = DefaultProtocol.randomBytes(DefaultProtocol.ENCRYPT_SK_SIZE);
  const pkVerify = DefaultProtocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = DefaultProtocol.publicKeyForEncryption(rawSkEnc);
  const fullPublicKey = DefaultProtocol.fullPublicKey(pkVerify, pkEnc);
  const keys = DefaultProtocol.separatedPublicKeys(fullPublicKey);
  expect(toHex(keys.pkVerify)).toBe(toHex(pkVerify));
  expect(toHex(keys.pkEnc)).toBe(toHex(pkEnc));
});

test('test separatedSecretKeys', () => {
  expect(() => DefaultProtocol.separatedSecretKeys('baadbeef')).toThrow();
  expect(() => DefaultProtocol.separatedSecretKeys(toBuff('baadbeef'))).toThrow();
  const rawSkVerify = DefaultProtocol.randomBytes(DefaultProtocol.VERIFY_SK_SIZE);
  const rawSkEnc = DefaultProtocol.randomBytes(DefaultProtocol.ENCRYPT_SK_SIZE);
  const skVerify = DefaultProtocol.secretKeyForVerification(rawSkVerify);
  const skEnc = DefaultProtocol.secretKeyForEncryption(rawSkEnc);
  const fullSecretKey = DefaultProtocol.fullSecretKey(skVerify, skEnc);
  const keys = DefaultProtocol.separatedSecretKeys(fullSecretKey);
  expect(toHex(keys.skVerify)).toBe(toHex(skVerify));
  expect(toHex(keys.skEnc)).toBe(toHex(skEnc));
});

test('test shieldedAddress', () => {
  expect(() => DefaultProtocol.shieldedAddress('baadbeef')).toThrow();
  expect(() => DefaultProtocol.shieldedAddress(toBuff('baadbeef'))).toThrow();
  const rawSkVerify = DefaultProtocol.randomBytes(DefaultProtocol.VERIFY_SK_SIZE);
  const rawSkEnc = DefaultProtocol.randomBytes(DefaultProtocol.ENCRYPT_SK_SIZE);
  const pkVerify = DefaultProtocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = DefaultProtocol.publicKeyForEncryption(rawSkEnc);
  const shieldedAddress = DefaultProtocol.shieldedAddress(pkVerify, pkEnc);
  expect(DefaultProtocol.isShieldedAddress(shieldedAddress)).toBe(true);
  const keys = DefaultProtocol.publicKeysFromShieldedAddress(shieldedAddress);
  expect(toHex(keys.pkVerify)).toBe(toHex(pkVerify));
  expect(toHex(keys.pkEnc)).toBe(toHex(pkEnc));
});

test('test isShieldedAddress', () => {
  expect(DefaultProtocol.isShieldedAddress('')).toBe(false);
  expect(DefaultProtocol.isShieldedAddress(1)).toBe(false);
  expect(DefaultProtocol.isShieldedAddress('axeddd#$')).toBe(false);
});

test('test asymmetric encryption/decryption', async () => {
  await expect(DefaultProtocol.encryptAsymmetric('baad', toBuff('beef'))).rejects.toThrow();
  await expect(DefaultProtocol.encryptAsymmetric(toBuff('beef'), 'baad')).rejects.toThrow();
  await expect(DefaultProtocol.decryptAsymmetric('baad', toBuff('beef'))).rejects.toThrow();
  await expect(DefaultProtocol.decryptAsymmetric(toBuff('beef'), 'baad')).rejects.toThrow();
  const rawSecretKey = DefaultProtocol.randomBytes(DefaultProtocol.ENCRYPT_SK_SIZE);
  const sk = DefaultProtocol.secretKeyForEncryption(rawSecretKey);
  const pk = DefaultProtocol.publicKeyForEncryption(rawSecretKey);
  const data = toBuff('baadbeefdeadbeef');
  const encryptedData = await DefaultProtocol.encryptAsymmetric(pk, data);
  const decryptedData = await DefaultProtocol.decryptAsymmetric(sk, encryptedData);
  expect(toHex(decryptedData)).toBe(toHex(data));
});

test('test symmetric encryption/decryption', () => {
  expect(() => DefaultProtocol.encryptSymmetric('baad', 1)).toThrow();
  expect(() => DefaultProtocol.encryptSymmetric(1, 'baad')).toThrow();
  expect(() => DefaultProtocol.decryptSymmetric('baad', 1)).toThrow();
  expect(() => DefaultProtocol.decryptSymmetric(1, 'baad')).toThrow();
  const plainText = 'mystiko is awesome';
  const cipherText = DefaultProtocol.encryptSymmetric('P@ssw0rd', plainText);
  expect(DefaultProtocol.decryptSymmetric('P@ssw0rd', cipherText)).toBe(plainText);
});

test('test hash', () => {
  expect(() => DefaultProtocol.hash('data to be hashed')).toThrow();
  const data1 = toBuff('baad');
  const data2 = toBuff('beef');
  const data3 = toBuff('baad');
  const hash1 = DefaultProtocol.hash(data1);
  const hash2 = DefaultProtocol.hash(data2);
  const hash3 = DefaultProtocol.hash(data3);
  expect(toHex(hash1)).not.toBe(toHex(hash2));
  expect(toHex(hash1)).toBe(toHex(hash3));
});

test('test hash2', () => {
  expect(() => DefaultProtocol.hash2('data to be hashed', new BN(1))).toThrow();
  expect(() => DefaultProtocol.hash2(new BN(1), 'data to be hashed')).toThrow();
  const h1 = DefaultProtocol.hash2(new BN(1), new BN(2));
  const h2 = DefaultProtocol.hash2(new BN(3), new BN(4));
  const h3 = DefaultProtocol.hash2(new BN(1), new BN(2));
  expect(h1.toString()).toBe(h3.toString());
  expect(h2.toString()).not.toBe(h3.toString());
});

test('test checksum', () => {
  expect(() => DefaultProtocol.checkSum(100, 'P@ssw0rd')).toThrow();
  expect(() => DefaultProtocol.checkSum('data to be hashed', 100)).toThrow();
  const hash1 = DefaultProtocol.checkSum('hello world');
  const hash2 = DefaultProtocol.checkSum('Mystiko is awesome', '');
  const hash3 = DefaultProtocol.checkSum('Mystiko is awesome', 'P@ssw0rd');
  const hash4 = DefaultProtocol.checkSum('hello world');
  expect(hash1).not.toBe(hash2);
  expect(hash2).not.toBe(hash3);
  expect(hash4).toBe(hash1);
  expect(hash3).toBe(
    '03b41505aa26437d94831f9bfd24afd4e7eaf33d6aaf368d0' +
      'c77545ad2a958024222badb4d84a17f84ff15297e16199dab' +
      'c88b417ce764624ed5a2443681afcd',
  );
  expect(hash2).toBe(
    'db3c4095645e61571b2994839bd19d61a3087e5f6d864c446' +
      '96f70058c2db602adbd2bf66d987b9f7e25006e99561eeb7d' +
      '2cbd960663701268cb5a45b300e4b0',
  );
});

test('test commitment', async () => {
  await expect(DefaultProtocol.commitment('deadbeef', toBuff('baadbabe'), new BN(1))).rejects.toThrow();
  await expect(DefaultProtocol.commitment(toBuff('baadbabe'), 'deadbeef', new BN(1))).rejects.toThrow();
  await expect(DefaultProtocol.commitment(toBuff('baadbabe'), toBuff('baadbabe'), 1)).rejects.toThrow();
  const rawSkVerify = DefaultProtocol.randomBytes(DefaultProtocol.VERIFY_SK_SIZE);
  const rawSkEnc = DefaultProtocol.randomBytes(DefaultProtocol.ENCRYPT_SK_SIZE);
  const pkVerify = DefaultProtocol.publicKeyForVerification(rawSkVerify);
  const skEnc = DefaultProtocol.secretKeyForEncryption(rawSkEnc);
  const pkEnc = DefaultProtocol.publicKeyForEncryption(rawSkEnc);
  const amount = toDecimals(100, 18);
  const { commitmentHash, privateNote, k, randomS } = await DefaultProtocol.commitment(
    pkVerify,
    pkEnc,
    amount,
  );
  expect(commitmentHash).not.toBe(undefined);
  expect(privateNote).not.toBe(undefined);
  expect(k).not.toBe(undefined);
  expect(randomS).not.toBe(undefined);
  const decryptedNote = await DefaultProtocol.decryptAsymmetric(skEnc, privateNote);
  expect(decryptedNote.length).toBe(DefaultProtocol.RANDOM_SK_SIZE * 3);
});

test('test commitmentWithShieldedAddress', async () => {
  await expect(DefaultProtocol.commitmentWithShieldedAddress(123, new BN(1))).rejects.toThrow();
  const rawSkVerify = DefaultProtocol.randomBytes(DefaultProtocol.VERIFY_SK_SIZE);
  const rawSkEnc = DefaultProtocol.randomBytes(DefaultProtocol.ENCRYPT_SK_SIZE);
  const pkVerify = DefaultProtocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = DefaultProtocol.publicKeyForEncryption(rawSkEnc);
  const shieldedAddress = DefaultProtocol.shieldedAddress(pkVerify, pkEnc);
  const { commitmentHash, privateNote } = await DefaultProtocol.commitmentWithShieldedAddress(
    shieldedAddress,
    new BN(1),
  );
  expect(commitmentHash).not.toBe(undefined);
  expect(privateNote).not.toBe(undefined);
});

test('test serialNumber', () => {
  expect(() => DefaultProtocol.serialNumber('deadbeef', toBuff('baadbabe'))).toThrow();
  expect(() => DefaultProtocol.serialNumber(toBuff('baadbabe'), 'deadbeef')).toThrow();
  const rawSkVerify = DefaultProtocol.randomBytes(DefaultProtocol.VERIFY_SK_SIZE);
  const skVerify = DefaultProtocol.secretKeyForVerification(rawSkVerify);
  const randomP = DefaultProtocol.randomBytes(DefaultProtocol.RANDOM_SK_SIZE);
  const serialNumber = DefaultProtocol.serialNumber(skVerify, randomP);
  expect(serialNumber).not.toBe(undefined);
});

test('test zkProve/zkVerify', async () => {
  const rawSkVerify = DefaultProtocol.randomBytes(DefaultProtocol.VERIFY_SK_SIZE);
  const rawSkEnc = DefaultProtocol.randomBytes(DefaultProtocol.ENCRYPT_SK_SIZE);
  const pkVerify = DefaultProtocol.publicKeyForVerification(rawSkVerify);
  const skVerify = DefaultProtocol.secretKeyForVerification(rawSkVerify);
  const skEnc = DefaultProtocol.secretKeyForEncryption(rawSkEnc);
  const pkEnc = DefaultProtocol.publicKeyForEncryption(rawSkEnc);
  const amount = toDecimals(100, 18);
  const commitment1 = await DefaultProtocol.commitment(pkVerify, pkEnc, amount);
  const commitment2 = await DefaultProtocol.commitment(pkVerify, pkEnc, amount);
  const treeLeaves = [commitment1.commitmentHash, commitment2.commitmentHash];
  const treeIndex = 1;
  const wasmFile = 'dist/circom/dev/withdraw.wasm';
  const zkeyFile = 'dist/circom/dev/withdraw.zkey';
  const vkeyFile = 'dist/circom/dev/withdraw.vkey.json';
  const { proof, publicSignals } = await DefaultProtocol.zkProve(
    pkVerify,
    skVerify,
    pkEnc,
    skEnc,
    amount,
    '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
    commitment2.commitmentHash,
    commitment2.privateNote,
    treeLeaves,
    treeIndex,
    wasmFile,
    zkeyFile,
  );
  let result = await DefaultProtocol.zkVerify(proof, publicSignals, vkeyFile);
  expect(result).toBe(true);
  publicSignals[3] = '0x722122dF12D4e14e13Ac3b6895a86e84145b6967';
  result = await DefaultProtocol.zkVerify(proof, publicSignals, vkeyFile);
  expect(result).toBe(false);
});
