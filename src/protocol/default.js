import unsafeRandomBytes from 'randombytes';
import { Scalar } from 'ffjavascript';
import createBlakeHash from 'blake-hash';
import { pedersenHash, eddsa, babyJub } from 'circomlib';
import cryptojs from 'crypto-js';
import aes from 'crypto-js/aes';
import hmacSHA512 from 'crypto-js/hmac-sha512';
import { PrivateKey as ECIESPrivateKey, encrypt as eciesEncrypt, decrypt as eciesDecrypt } from 'eciesjs';
import MerkleTree from 'fixed-merkle-tree';
import { groth16, wtns } from 'snarkjs';
import * as fastfile from 'fastfile';
import bs58 from 'bs58';
import { toHex, check } from '../utils.js';

export const FIELD_SIZE = BigInt(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617',
);
export const VERIFY_PK_SIZE = 32;
export const VERIFY_SK_SIZE = 32;
export const RANDOM_SK_SIZE = 16;
export const ENCRYPT_SK_SIZE = 32;
export const ENCRYPT_PK_SIZE = 33;
export const HASH_SIZE = 32;
export const MERKLE_TREE_LEVELS = 20;
export default class DefaultProtocol {
  static randomBigInt(numBytes = 32) {
    let bigInt = BigInt(toHex(unsafeRandomBytes(numBytes)));
    if (bigInt >= FIELD_SIZE) {
      bigInt = bigInt % FIELD_SIZE;
    }
    return bigInt;
  }

  static randomBytes(numBytes = 32) {
    return DefaultProtocol.bigIntToBuff(DefaultProtocol.randomBigInt(numBytes), numBytes);
  }

  static secretKeyForVerification(rawSecretKey) {
    check(rawSecretKey instanceof Buffer, 'unsupported rawSecretKey type ' + typeof rawSecretKey);
    check(rawSecretKey.length == VERIFY_SK_SIZE, 'rawSecretKey length does not equal to ' + VERIFY_SK_SIZE);
    const keyHash = createBlakeHash('blake512').update(rawSecretKey).digest().slice(0, VERIFY_SK_SIZE);
    const sBuffer = eddsa.pruneBuffer(keyHash);
    const skBigInt = Scalar.shr(DefaultProtocol.buffToBigInt(sBuffer), 3);
    check(skBigInt < FIELD_SIZE, 'skBigInt should be less than FIELD_SIZE');
    const sk = DefaultProtocol.bigIntToBuff(skBigInt, VERIFY_SK_SIZE);
    check(
      sk.length == VERIFY_SK_SIZE,
      'converted secret key length ' + sk.length + ' not equal to ' + FIELD_SIZE,
    );
    return sk;
  }

  static publicKeyForVerification(rawSecretKey) {
    check(rawSecretKey instanceof Buffer, 'unsupported rawSecretKey type ' + typeof rawSecretKey);
    check(rawSecretKey.length == VERIFY_SK_SIZE, 'rawSecretKey length does not equal to ' + VERIFY_SK_SIZE);
    const unpackedPoints = eddsa.prv2pub(rawSecretKey);
    check(unpackedPoints[0] < FIELD_SIZE, 'first point should be less than FIELD_SIZE');
    const pk = DefaultProtocol.bigIntToBuff(unpackedPoints[0], VERIFY_PK_SIZE);
    check(
      pk.length == VERIFY_PK_SIZE,
      'converted public key length ' + pk.length + ' not equal to ' + FIELD_SIZE,
    );
    return pk;
  }

  static secretKeyForEncryption(rawSecretKey) {
    check(rawSecretKey instanceof Buffer, 'unsupported rawSecretKey type ' + typeof rawSecretKey);
    check(rawSecretKey.length == ENCRYPT_SK_SIZE, 'rawSecretKey length does not equal to ' + ENCRYPT_SK_SIZE);
    return rawSecretKey;
  }

  static publicKeyForEncryption(rawSecretKey) {
    check(rawSecretKey instanceof Buffer, 'unsupported rawSecretKey type ' + typeof rawSecretKey);
    check(rawSecretKey.length == ENCRYPT_SK_SIZE, 'rawSecretKey length does not equal to ' + ENCRYPT_SK_SIZE);
    const publicKey = new ECIESPrivateKey(rawSecretKey).publicKey.compressed;
    check(
      publicKey.length == ENCRYPT_PK_SIZE,
      'generate public key length does not equal to ' + ENCRYPT_PK_SIZE,
    );
    return publicKey;
  }

  static fullPublicKey(pkVerify, pkEnc) {
    check(pkVerify instanceof Buffer, 'unsupported pkVerify type ' + typeof pkVerify);
    check(pkVerify.length == VERIFY_PK_SIZE, 'pkVerify length does not equal to ' + VERIFY_PK_SIZE);
    check(pkEnc instanceof Buffer, 'unsupported pkEnc type ' + typeof pkEnc);
    check(pkEnc.length == ENCRYPT_PK_SIZE, 'pkEnc length does not equal to ' + ENCRYPT_PK_SIZE);
    return Buffer.concat([pkVerify, pkEnc]);
  }

  static fullSecretKey(skVerify, skEnc) {
    check(skVerify instanceof Buffer, 'unsupported skVerify type ' + typeof skVerify);
    check(skVerify.length == VERIFY_SK_SIZE, 'skVerify length does not equal to ' + VERIFY_SK_SIZE);
    check(skEnc instanceof Buffer, 'unsupported skEnc type ' + typeof skEnc);
    check(skEnc.length == ENCRYPT_SK_SIZE, 'skEnc length does not equal to ' + ENCRYPT_SK_SIZE);
    return Buffer.concat([skVerify, skEnc]);
  }

  static separatedPublicKeys(fullPublicKey) {
    check(fullPublicKey instanceof Buffer, 'unsupported fullPublicKey type ' + typeof fullPublicKey);
    const expectedSize = VERIFY_PK_SIZE + ENCRYPT_PK_SIZE;
    check(fullPublicKey.length == expectedSize, 'fullPublicKey length does not equal to ' + expectedSize);
    return { pkVerify: fullPublicKey.slice(0, VERIFY_PK_SIZE), pkEnc: fullPublicKey.slice(VERIFY_PK_SIZE) };
  }

  static separatedSecretKeys(fullSecretKey) {
    check(fullSecretKey instanceof Buffer, 'unsupported fullSecretKey type ' + typeof fullSecretKey);
    const expectedSize = VERIFY_SK_SIZE + ENCRYPT_SK_SIZE;
    check(fullSecretKey.length == expectedSize, 'fullSecretKey length does not equal to ' + expectedSize);
    return { skVerify: fullSecretKey.slice(0, VERIFY_SK_SIZE), skEnc: fullSecretKey.slice(VERIFY_SK_SIZE) };
  }

  static shieldedAddress(pkVerify, pkEnc) {
    return bs58.encode(DefaultProtocol.fullPublicKey(pkVerify, pkEnc));
  }

  static isShieldedAddress(address) {
    if (typeof address === 'string') {
      try {
        const decoded = bs58.decode(address);
        if (decoded.length == VERIFY_PK_SIZE + ENCRYPT_PK_SIZE) {
          return true;
        }
      } catch {
        return false;
      }
    }
    return false;
  }

  static publicKeysFromShieldedAddress(address) {
    check(DefaultProtocol.isShieldedAddress(address), address + ' is a invalid address format');
    return DefaultProtocol.separatedPublicKeys(bs58.decode(address));
  }

  static encryptAsymmetric(publicKey, plainData) {
    check(publicKey instanceof Buffer, 'unsupported publicKey type ' + typeof publicKey);
    check(plainData instanceof Buffer, 'unsupported plainData type ' + typeof plainData);
    return eciesEncrypt(publicKey, plainData);
  }

  static decryptAsymmetric(secretKey, cipherData) {
    check(secretKey instanceof Buffer, 'unsupported secretKey type ' + typeof secretKey);
    check(cipherData instanceof Buffer, 'unsupported cipherData type ' + typeof cipherData);
    return eciesDecrypt(secretKey, cipherData);
  }

  static encryptSymmetric(password, plainText) {
    check(typeof password === 'string', 'unsupported password type ' + typeof password);
    check(typeof plainText === 'string', 'unsupported plainText type ' + typeof plainText);
    return aes.encrypt(plainText, password).toString();
  }

  static decryptSymmetric(password, cipherText) {
    check(typeof password === 'string', 'unsupported password type ' + typeof password);
    check(typeof cipherText === 'string', 'unsupported cipherText type ' + typeof plainText);
    return aes.decrypt(cipherText, password).toString(cryptojs.enc.Utf8);
  }

  static hash(data) {
    check(data instanceof Buffer, 'unsupported data type ' + typeof data);
    const packedPoints = pedersenHash.hash(data);
    const unpackedPoints = babyJub.unpackPoint(packedPoints);
    check(unpackedPoints[0] < FIELD_SIZE, 'first point should be less than FIELD_SIZE');
    return unpackedPoints[0];
  }

  static checkSum(data, salt = 'mystiko') {
    check(typeof data === 'string', 'unsupported data type ' + typeof data);
    check(typeof salt === 'string', 'unsupported salt type ' + typeof salt);
    return hmacSHA512(data, salt).toString();
  }

  // little endianness
  static buffToBigInt(buff) {
    check(buff instanceof Buffer, 'unsupported buff type ' + typeof buff);
    let res = BigInt(0);
    for (let i = 0; i < buff.length; i++) {
      const byteNumber = BigInt(buff[i]);
      res = res + (byteNumber << BigInt(8 * i));
    }
    return res;
  }

  // little endianness
  static bigIntToBuff(bigInt, numBytes = 32) {
    check(typeof bigInt === 'bigint', 'unsupported bigInt type ' + typeof bigInt);
    let res = bigInt;
    let index = 0;
    const buff = new Uint8Array(numBytes);
    while (res > BigInt(0) && index < numBytes) {
      buff[index] = Number(res & BigInt(255));
      index = index + 1;
      res = res >> BigInt(8);
    }
    if (res !== BigInt(0)) {
      throw new Error('Number does not fit in this length');
    }
    return Buffer.from(buff);
  }

  static commitment(pkVerify, pkEnc, amount, randomP, randomR, randomS) {
    check(pkVerify instanceof Buffer, 'unsupported pkVerify type ' + typeof pkVerify);
    check(pkEnc instanceof Buffer, 'unsupported pkEnc type ' + typeof pkEnc);
    check(typeof amount === 'bigint', 'unsupported amount type ' + typeof amount);
    check(!randomS || randomP instanceof Buffer, 'unsupported randomP type ' + typeof randomP);
    check(!randomR || randomR instanceof Buffer, 'unsupported randomR type ' + typeof randomR);
    check(!randomS || randomS instanceof Buffer, 'unsupported randomS type ' + typeof randomS);
    randomP = randomP ? randomP : DefaultProtocol.randomBytes(RANDOM_SK_SIZE);
    randomR = randomR ? randomR : DefaultProtocol.randomBytes(RANDOM_SK_SIZE);
    randomS = randomS ? randomS : DefaultProtocol.randomBytes(RANDOM_SK_SIZE);
    const amountBuffer = DefaultProtocol.bigIntToBuff(amount);
    const k = DefaultProtocol.hash(Buffer.concat([pkVerify, randomP, randomR]));
    const kBuff = DefaultProtocol.bigIntToBuff(k, HASH_SIZE);
    const commitmentHash = DefaultProtocol.hash(Buffer.concat([amountBuffer, kBuff, randomS]));
    const privateNote = DefaultProtocol.encryptAsymmetric(pkEnc, Buffer.concat([randomP, randomR, randomS]));
    return { commitmentHash, privateNote };
  }

  static serialNumber(skVerify, randomP) {
    check(skVerify instanceof Buffer, 'unsupported skVerify type ' + typeof skVerify);
    check(randomP instanceof Buffer, 'unsupported skVerify type ' + typeof randomP);
    return DefaultProtocol.hash(Buffer.concat([randomP, skVerify]));
  }

  static async zkProve(
    pkVerify,
    skVerify,
    pkEnc,
    skEnc,
    amount,
    commitmentHash,
    privateNote,
    treeLeaves,
    treeIndex,
    wasmFile,
    zkeyFile,
  ) {
    check(pkVerify instanceof Buffer, 'unsupported pkVerify type ' + typeof pkVerify);
    check(skVerify instanceof Buffer, 'unsupported skVerify type ' + typeof skVerify);
    check(pkEnc instanceof Buffer, 'unsupported pkEnc type ' + typeof pkEnc);
    check(skEnc instanceof Buffer, 'unsupported skEnc type ' + typeof skEnc);
    check(typeof amount === 'bigint', 'unsupported amount type ' + typeof amount);
    check(typeof commitmentHash === 'bigint', 'unsupported commitmentHash type ' + typeof commitmentHash);
    check(privateNote instanceof Buffer, 'unsupported privateNote type ' + typeof privateNote);
    check(treeLeaves instanceof Array, 'unsupported treeLeaves type ' + typeof treeLeaves);
    check(typeof treeIndex === 'number', 'unsupported treeIndex type ' + typeof treeIndex);
    check(typeof wasmFile === 'string', 'unsupported wasmFile type ' + typeof wasmFile);
    check(typeof zkeyFile === 'string', 'unsupported zkeyFile type ' + typeof zkeyFile);
    const decryptedNote = DefaultProtocol.decryptAsymmetric(skEnc, privateNote);
    check(decryptedNote.length == RANDOM_SK_SIZE * 3, 'decrypted note length is incorrect');
    const randomP = decryptedNote.slice(0, RANDOM_SK_SIZE);
    const randomR = decryptedNote.slice(RANDOM_SK_SIZE, RANDOM_SK_SIZE * 2);
    const randomS = decryptedNote.slice(RANDOM_SK_SIZE * 2);
    const computedCommitmentHash = DefaultProtocol.commitment(
      pkVerify,
      pkEnc,
      amount,
      randomP,
      randomR,
      randomS,
    );
    check(
      toHex(commitmentHash) === toHex(computedCommitmentHash.commitmentHash),
      'given commitmentHash does not match with other parameters',
    );
    const sn = DefaultProtocol.serialNumber(skVerify, randomP);
    const tree = new MerkleTree(MERKLE_TREE_LEVELS, treeLeaves);
    const { pathElements, pathIndices } = tree.path(treeIndex);
    const inputs = {
      // public inputs
      rootHash: tree.root(),
      serialNumber: sn,
      amount,
      // private inputs
      pathElements,
      pathIndices,
      publicKey: DefaultProtocol.buffToBigInt(pkVerify),
      secretKey: DefaultProtocol.buffToBigInt(skVerify),
      randomP: DefaultProtocol.buffToBigInt(randomP),
      randomR: DefaultProtocol.buffToBigInt(randomR),
      randomS: DefaultProtocol.buffToBigInt(randomS),
      commitment: commitmentHash,
    };
    const wtnsOptions = { type: 'mem' };
    await wtns.calculate(inputs, wasmFile, wtnsOptions);
    return await groth16.prove(zkeyFile, wtnsOptions);
  }

  static async zkVerify(proof, publicSignals, verifyKeyFile) {
    const vkeyFile = await fastfile.readExisting(verifyKeyFile);
    const vkeyData = await vkeyFile.read(vkeyFile.totalSize);
    await vkeyFile.close();
    const vkey = JSON.parse(Buffer.from(vkeyData));
    return await groth16.verify(vkey, publicSignals, proof);
  }
}
