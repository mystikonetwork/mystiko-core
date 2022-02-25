import unsafeRandomBytes from 'randombytes';
import { Scalar } from 'ffjavascript';
import createBlakeHash from 'blake-hash';
import { eddsa, poseidon } from 'circomlibjs';
import cryptojs from 'crypto-js';
import aes from 'crypto-js/aes';
import hmacSHA512 from 'crypto-js/hmac-sha512';
import eccrypto from 'eccrypto';
import { groth16 } from 'snarkjs';
import bs58 from 'bs58';
import { ethers } from 'ethers';
import BN from 'bn.js';
import {
  toHex,
  toString,
  check,
  toHexNoPrefix,
  readJsonFile,
  toBuff,
  toFixedLenHexNoPrefix,
  toBN,
  readCompressedFile,
  logger,
} from '@mystiko/utils';
import { FIELD_SIZE } from '../constants';
import { MerkleTree } from '../merkle';
import WithdrawWitnessCalculator from '../witness_calculator';

/**
 * @module module:mystiko/protocol/v1
 * @desc default implementation of Mystiko protocol.
 */
/**
 * @memberOf module:mystiko/protocol/v1
 * @name module:mystiko/protocol/v1.VERIFY_PK_SIZE
 * @type {number}
 * @desc the number bytes of public key for zkp verification.
 */
export const VERIFY_PK_SIZE: number = 32;
/**
 * @memberOf module:mystiko/protocol/v1
 * @name module:mystiko/protocol/v1.VERIFY_SK_SIZE
 * @type {number}
 * @desc the number bytes of secret key for zkp verification.
 */
export const VERIFY_SK_SIZE: number = 32;
/**
 * @memberOf module:mystiko/protocol/v1
 * @name module:mystiko/protocol/v1.RANDOM_SK_SIZE
 * @type {number}
 * @desc the number bytes of random secret when generating commitment.
 */
export const RANDOM_SK_SIZE: number = 16;
/**
 * @memberOf module:mystiko/protocol/v1
 * @name module:mystiko/protocol/v1.ENCRYPT_SK_SIZE
 * @type {number}
 * @desc the number bytes of secret key for asymmetric encryption.
 */
export const ENCRYPT_SK_SIZE: number = 32;
/**
 * @memberOf module:mystiko/protocol/v1
 * @name module:mystiko/protocol/v1.ENCRYPT_PK_SIZE
 * @type {number}
 * @desc the number bytes of public key for asymmetric encryption.
 */
export const ENCRYPT_PK_SIZE: number = 33;
/**
 * @memberOf module:mystiko/protocol/v1
 * @name module:mystiko/protocol/v1.HASH_SIZE
 * @type {number}
 * @desc the number bytes of hash function output.
 */
export const HASH_SIZE: number = 32;
/**
 * @memberOf module:mystiko/protocol/v1
 * @name module:mystiko/protocol/v1.MERKLE_TREE_LEVELS
 * @type {number}
 * @desc the number of levels of the merkle tree stored on chain.
 */
export const MERKLE_TREE_LEVELS: number = 20;

const ECIES_IV_LENGTH = 16;
const ECIES_EPHEM_PK_LENGTH = 65;
const ECIES_MAC_LENGTH = 32;
const ECIES_META_LENGTH = ECIES_IV_LENGTH + ECIES_EPHEM_PK_LENGTH + ECIES_MAC_LENGTH;

/**
 * @function module:mystiko/protocol/v1.buffToBigInt
 * @desc convert a Buffer into big number with little endianness.
 * @param {Buffer} buff instance to be converted.
 * @returns {BN} the converted big number.
 */
export function buffToBigInt(buff: Buffer): BN {
  let res = toBN(0);
  for (let i = 0; i < buff.length; i += 1) {
    const byteNumber = toBN(buff[i]);
    res = res.add(byteNumber.shln(8 * i));
  }
  return res;
}

/**
 * @function module:mystiko/protocol/v1.bigIntToBuff
 * @desc convert a big number into Buffer with little endianness.
 * @param {BN} bigInt the big number to be converted.
 * @param {number} [numBytes=32] expected number of bytes to fit this big number.
 * @returns {Buffer} the converted buffer with the length same as the given numBytes.
 * @throws {Error} if the big number cannot fit into the given number of bytes.
 */
export function bigIntToBuff(bigInt: BN, numBytes: number = 32): Buffer {
  let res = bigInt;
  let index = 0;
  const buff = new Uint8Array(numBytes);
  while (res.gt(toBN(0)) && index < numBytes) {
    buff[index] = Number(res.and(toBN(255)).toString());
    index += 1;
    res = res.shrn(8);
  }
  if (!res.isZero()) {
    throw new Error('Number does not fit in this length');
  }
  return Buffer.from(buff);
}

/**
 * @function module:mystiko/protocol/v1.randomBigInt
 * @desc generate random big number which could fit into the given number of bytes.
 * @param {number} [numBytes=32] number of bytes this generated big number must be fit into.
 * @returns {BN} a {@link BN} instance, which should be less than
 * {@link module:mystiko/protocol/v1.FIELD_SIZE}
 */
export function randomBigInt(numBytes: number = 32): BN {
  let bigInt = toBN(toHexNoPrefix(unsafeRandomBytes(numBytes)), 16);
  if (bigInt.gte(FIELD_SIZE)) {
    bigInt = bigInt.mod(FIELD_SIZE);
  }
  return bigInt;
}

/**
 * @function module:mystiko/protocol/v1.randomBytes
 * @desc generate random bytes with the given number of bytes.
 * @param {number} [numBytes=32] number of bytes this generated big number must be fit into.
 * @returns {Buffer} the generated bytes as Buffer.
 */
export function randomBytes(numBytes: number = 32): Buffer {
  return bigIntToBuff(randomBigInt(numBytes), numBytes);
}

/**
 * @function module:mystiko/protocol/v1.secretKeyForVerification
 * @desc get the secret key for verification from the raw secret key.
 * @param {Buffer} rawSecretKey raw secret key bytes.
 * @returns {Buffer} the secret key as Buffer.
 */
export function secretKeyForVerification(rawSecretKey: Buffer): Buffer {
  check(rawSecretKey.length === VERIFY_SK_SIZE, `rawSecretKey length does not equal to ${VERIFY_SK_SIZE}`);
  const keyHash = createBlakeHash('blake512').update(rawSecretKey).digest().slice(0, VERIFY_SK_SIZE);
  const sBuffer = eddsa.pruneBuffer(keyHash);
  const skBigInt = Scalar.shr(buffToBigInt(sBuffer).toString(), 3);
  check(FIELD_SIZE.gt(toBN(skBigInt.toString())), 'skBigInt should be less than FIELD_SIZE');
  const sk = bigIntToBuff(toBN(skBigInt.toString()), VERIFY_SK_SIZE);
  check(sk.length === VERIFY_SK_SIZE, `converted secret key length ${sk.length} not equal to ${FIELD_SIZE}`);
  return sk;
}

/**
 * @function module:mystiko/protocol/v1.publicKeyForVerification
 * @desc get the public key for verification from the raw secret key.
 * @param {Buffer} rawSecretKey raw secret key bytes.
 * @returns {Buffer} the public key as Buffer.
 */
export function publicKeyForVerification(rawSecretKey: Buffer): Buffer {
  check(rawSecretKey.length === VERIFY_SK_SIZE, `rawSecretKey length does not equal to ${VERIFY_SK_SIZE}`);
  const unpackedPoints = eddsa.prv2pub(rawSecretKey);
  const pkInt = toBN(unpackedPoints[0].toString());
  check(pkInt.lt(FIELD_SIZE), 'first point should be less than FIELD_SIZE');
  const pk = bigIntToBuff(pkInt, VERIFY_PK_SIZE);
  check(pk.length === VERIFY_PK_SIZE, `converted public key length ${pk.length} not equal to ${FIELD_SIZE}`);
  return pk;
}

/**
 * @function module:mystiko/protocol/v1.secretKeyForEncryption
 * @desc get the secret key for asymmetric encryption from the raw secret key.
 * @param {Buffer} rawSecretKey raw secret key bytes.
 * @returns {Buffer} the secret key as Buffer.
 */
export function secretKeyForEncryption(rawSecretKey: Buffer): Buffer {
  check(rawSecretKey.length === ENCRYPT_SK_SIZE, `rawSecretKey length does not equal to ${ENCRYPT_SK_SIZE}`);
  return rawSecretKey;
}

/**
 * @function module:mystiko/protocol/v1.publicKeyForEncryption
 * @desc get the public key for asymmetric encryption from the raw secret key.
 * @param {Buffer} rawSecretKey raw secret key bytes.
 * @returns {Buffer} the public key as Buffer.
 */
export function publicKeyForEncryption(rawSecretKey: Buffer): Buffer {
  check(rawSecretKey.length === ENCRYPT_SK_SIZE, `rawSecretKey length does not equal to ${ENCRYPT_SK_SIZE}`);
  const publicKey = eccrypto.getPublicCompressed(rawSecretKey);
  check(
    publicKey.length === ENCRYPT_PK_SIZE,
    `generate public key length does not equal to ${ENCRYPT_PK_SIZE}`,
  );
  return publicKey;
}

/**
 * @function module:mystiko/protocol/v1.fullPublicKey
 * @desc get full single public key by combing public key for zkp verification
 * and public key for asymmetric encryption.
 * @param {Buffer} pkVerify public key for zkp verification.
 * @param {Buffer} pkEnc public key for asymmetric encryption.
 * @returns {Buffer} a single Buffer as a full public key.
 */
export function fullPublicKey(pkVerify: Buffer, pkEnc: Buffer): Buffer {
  check(pkVerify.length === VERIFY_PK_SIZE, `pkVerify length does not equal to ${VERIFY_PK_SIZE}`);
  check(pkEnc.length === ENCRYPT_PK_SIZE, `pkEnc length does not equal to ${ENCRYPT_PK_SIZE}`);
  return Buffer.concat([pkVerify, pkEnc]);
}

/**
 * @function module:mystiko/protocol/v1.fullSecretKey
 * @desc get full single secret key by combing secret key for zkp verification
 * and secret key for asymmetric encryption.
 * @param {Buffer} skVerify secret key for zkp verification.
 * @param {Buffer} skEnc secret key for asymmetric encryption.
 * @returns {Buffer} a single Buffer as a full secret key.
 */
export function fullSecretKey(skVerify: Buffer, skEnc: Buffer): Buffer {
  check(skVerify.length === VERIFY_SK_SIZE, `skVerify length does not equal to ${VERIFY_SK_SIZE}`);
  check(skEnc.length === ENCRYPT_SK_SIZE, `skEnc length does not equal to ${ENCRYPT_SK_SIZE}`);
  return Buffer.concat([skVerify, skEnc]);
}

/**
 * @function module:mystiko/protocol/v1.separatedPublicKeys
 * @desc get separated public keys from single full key, it returns public key for zkp verification and
 * public key for asymmetric encryption.
 * @param {Buffer} longPublicKey a single full public key instance.
 * @returns {{pkEnc: Buffer, pkVerify: Buffer}} the separated public keys.
 * @throws {Error} if the input full public key has incorrect length.
 */
export function separatedPublicKeys(longPublicKey: Buffer): { pkEnc: Buffer; pkVerify: Buffer } {
  const expectedSize = VERIFY_PK_SIZE + ENCRYPT_PK_SIZE;
  check(longPublicKey.length === expectedSize, `fullPublicKey length does not equal to ${expectedSize}`);
  return { pkVerify: longPublicKey.slice(0, VERIFY_PK_SIZE), pkEnc: longPublicKey.slice(VERIFY_PK_SIZE) };
}

/**
 * @function module:mystiko/protocol/v1.separatedSecretKeys
 * @desc get separated secrets keys from single full key, it returns secret key for zkp verification and
 * secret key for asymmetric encryption.
 * @param {Buffer} longSecretKey a single full secret key instance.
 * @returns {{skVerify: Buffer, skEnc: Buffer}} the separated secret keys.
 * @throws {Error} if the input full secret key has incorrect length.
 */
export function separatedSecretKeys(longSecretKey: Buffer): { skVerify: Buffer; skEnc: Buffer } {
  const expectedSize = VERIFY_SK_SIZE + ENCRYPT_SK_SIZE;
  check(longSecretKey.length === expectedSize, `fullSecretKey length does not equal to ${expectedSize}`);
  return { skVerify: longSecretKey.slice(0, VERIFY_SK_SIZE), skEnc: longSecretKey.slice(VERIFY_SK_SIZE) };
}

/**
 * @function module:mystiko/protocol/v1.shieldedAddress
 * @desc convert a pair of public keys to Base58 encoded shielded address.
 * @param {Buffer} pkVerify public key for zkp verification.
 * @param {Buffer} pkEnc public key for asymmetric encryption.
 * @returns {string} Base58 encoded shielded address.
 */
export function shieldedAddress(pkVerify: Buffer, pkEnc: Buffer): string {
  return bs58.encode(fullPublicKey(pkVerify, pkEnc));
}

/**
 * @function module:mystiko/protocol/v1.isShieldedAddress
 * @desc check whether a given address string is shielded address.
 * @param {string} address the address string
 * @returns {boolean} true if it is valid, otherwise it returns false.
 */
export function isShieldedAddress(address: string): boolean {
  try {
    const decoded = bs58.decode(address);
    return decoded.length === VERIFY_PK_SIZE + ENCRYPT_PK_SIZE;
  } catch {
    return false;
  }
}

/**
 * @function module:mystiko/protocol/v1.publicKeysFromShieldedAddress
 * @desc get separated public keys from shielded address.
 * @param {string} address the address string.
 * @returns {{pkEnc: Buffer, pkVerify: Buffer}} the separated public keys.
 * @throws {Error} if the given address string is not a valid shielded address.
 */
export function publicKeysFromShieldedAddress(address: string): { pkEnc: Buffer; pkVerify: Buffer } {
  check(isShieldedAddress(address), `${address} is a invalid address format`);
  return separatedPublicKeys(bs58.decode(address));
}

/**
 * @function module:mystiko/protocol/v1.encryptAsymmetric
 * @desc do asymmetric encryption by ECIES encryption scheme.
 * @param {Buffer} publicKey public key for this encryption.
 * @param {Buffer} plainData plain data to be encrypted.
 * @returns {Promise<Buffer>} promise of an encrypted data buffer.
 */
export function encryptAsymmetric(publicKey: Buffer, plainData: Buffer): Promise<Buffer> {
  return eccrypto
    .encrypt(publicKey, plainData)
    .then((r) => Buffer.concat([r.iv, r.ephemPublicKey, r.mac, r.ciphertext]));
}

/**
 * @function module:mystiko/protocol/v1.decryptAsymmetric
 * @desc do asymmetric decryption with ECIES encryption scheme.
 * @param {Buffer} secretKey secret key for this decryption.
 * @param {Buffer} cipherData encrypted data to be decrypted.
 * @returns {Promise<Buffer>} promise of a decrypted data buffer.
 */
export function decryptAsymmetric(secretKey: Buffer, cipherData: Buffer) {
  check(cipherData.length > ECIES_META_LENGTH, 'incorrect cipherData length');
  return eccrypto.decrypt(secretKey, {
    iv: cipherData.slice(0, ECIES_IV_LENGTH),
    ephemPublicKey: cipherData.slice(ECIES_IV_LENGTH, ECIES_IV_LENGTH + ECIES_EPHEM_PK_LENGTH),
    mac: cipherData.slice(ECIES_IV_LENGTH + ECIES_EPHEM_PK_LENGTH, ECIES_META_LENGTH),
    ciphertext: cipherData.slice(ECIES_META_LENGTH),
  });
}

/**
 * @function module:mystiko/protocol/v1.encryptSymmetric
 * @desc do symmetric encryption with AES encryption scheme.
 * @param {string} password the password for AES encryption.
 * @param {string} plainText plain text data to be encrypted.
 * @returns {string} encrypted data string.
 */
export function encryptSymmetric(password: string, plainText: string): string {
  return aes.encrypt(plainText, password).toString();
}

/**
 * @function module:mystiko/protocol/v1.decryptSymmetric
 * @desc do symmetric decryption with AES encryption scheme.
 * @param {string} password the password for AES encryption.
 * @param {string} cipherText encrypted data to be decrypted.
 * @returns {string} decrypted data string.
 */
export function decryptSymmetric(password: string, cipherText: string): string {
  return aes.decrypt(cipherText, password).toString(cryptojs.enc.Utf8);
}

/**
 * @function module:mystiko/protocol/v1.sha256
 * @desc calculate the SHA256 hash of an array of inputs.
 * @param {Array.<Buffer>} inputs an array of Buffer.
 * @returns {BN} a big number as the hash.
 */
export function sha256(inputs: Buffer[]): BN {
  const merged = Buffer.concat(inputs);
  const result = ethers.utils.sha256(toHex(merged));
  return toBN(toHexNoPrefix(result), 16).mod(FIELD_SIZE);
}

/**
 * @function module:mystiko/protocol/v1.poseidonHash
 * @desc calculate the Poseidon hash of an array of inputs.
 * @param {Array.<BN>} inputs an array of BN.
 * @returns {BN} a big number as the hash.
 */
export function poseidonHash(inputs: BN[]): BN {
  check(inputs.length < 7, 'inputs length should be not greater than 6');
  const result = poseidon(inputs);
  const resultNum = toBN(result.toString());
  check(resultNum.lt(FIELD_SIZE), 'resultNum should be less than FIELD_SIZE');
  return resultNum;
}

/**
 * @function module:mystiko/protocol/v1.checkSum
 * @desc calculate the checksum of given data with the salt, by using HMAC+SHA512 algorithm.
 * @param {string} data data to calculate the checksum.
 * @param {string} [salt='mystiko'] a salt for improve security.
 * @returns {string} the checksum of given data.
 */
export function checkSum(data: string, salt: string = 'mystiko'): string {
  return hmacSHA512(data, salt).toString();
}

/**
 * @function module:mystiko/protocol/v1.commitment
 * @desc calculate the commitment for the deposit transaction.
 * @param {Buffer} pkVerify public key for zkp verification.
 * @param {Buffer} pkEnc public key for asymmetric encryption.
 * @param {BN} amount asset amount to be deposited.
 * @param {BN} [randomP] random secret P. If not given, this function will generate a random one.
 * @param {BN} [randomR] random secret R. If not given, this function will generate a random one.
 * @param {BN} [randomS] random secret S. If not given, this function will generate a random one.
 * @returns {Promise<{privateNote: Buffer, randomS: BN, commitmentHash: BN, k: BN}>}
 * the encrypted private note, random secret S, intermediate hash k and the commitment hash.
 */
export async function commitment(
  pkVerify: Buffer,
  pkEnc: Buffer,
  amount: BN,
  randomP?: BN,
  randomR?: BN,
  randomS?: BN,
): Promise<{ privateNote: Buffer; randomS: BN; commitmentHash: BN; k: BN }> {
  const generatedRandomP = randomP || randomBigInt(RANDOM_SK_SIZE);
  const generatedRandomR = randomR || randomBigInt(RANDOM_SK_SIZE);
  const generatedRandomS = randomS || randomBigInt(RANDOM_SK_SIZE);
  const k = poseidonHash([buffToBigInt(pkVerify), generatedRandomP, generatedRandomR]);
  const commitmentHash = sha256([
    toBuff(toFixedLenHexNoPrefix(k)),
    toBuff(toFixedLenHexNoPrefix(amount)),
    toBuff(toFixedLenHexNoPrefix(generatedRandomS, RANDOM_SK_SIZE)),
  ]);
  const privateNote = await encryptAsymmetric(
    pkEnc,
    Buffer.concat([
      bigIntToBuff(generatedRandomP, RANDOM_SK_SIZE),
      bigIntToBuff(generatedRandomR, RANDOM_SK_SIZE),
      bigIntToBuff(generatedRandomS, RANDOM_SK_SIZE),
    ]),
  );
  logger.debug(
    'commitment generation is done:' +
      `commitmentHash='${toString(commitmentHash)}', ` +
      `randomS='${toString(randomS)}', ` +
      `privateNote='${toHex(privateNote)}'`,
  );
  return { commitmentHash, k, randomS: generatedRandomS, privateNote };
}

/**
 * @function module:mystiko/protocol/v1.commitmentWithShieldedAddress
 * @desc calculate the commitment for the deposit transaction with the recipient shielded address.
 * @param {string} shieldedRecipientAddress the shielded address for this deposit goes to.
 * @param {BN} amount asset amount to be deposited.
 * @param {BN} [randomP] random secret P. If not given, this function will generate a random one.
 * @param {BN} [randomR] random secret R. If not given, this function will generate a random one.
 * @param {BN} [randomS] random secret S. If not given, this function will generate a random one.
 * @returns {Promise<{privateNote: Buffer, randomS: BN, commitmentHash: BN, k: BN}>}
 * the encrypted private note, random secret S, intermediate hash k and the commitment hash.
 */
export function commitmentWithShieldedAddress(
  shieldedRecipientAddress: string,
  amount: BN,
  randomP?: BN,
  randomR?: BN,
  randomS?: BN,
): Promise<{ privateNote: Buffer; randomS: BN; commitmentHash: BN; k: BN }> {
  const { pkVerify, pkEnc } = publicKeysFromShieldedAddress(shieldedRecipientAddress);
  return commitment(pkVerify, pkEnc, amount, randomP, randomR, randomS);
}

/**
 * @function module:mystiko/protocol/v1.serialNumber
 * @desc calculate serial number for withdrawal transaction.
 * @param {Buffer} skVerify secret key for zkp verification.
 * @param {BN} randomP random secret P.
 * @returns {BN} the calculated serial number.
 */
export function serialNumber(skVerify: Buffer, randomP: BN): BN {
  return poseidonHash([randomP, buffToBigInt(skVerify)]);
}

export interface WitnessCalculatorInterface {
  calculateWTNSBin(input: any, sanityCheck: any): Promise<Uint8Array>;
}

export function WitnessCalculatorBuilder(code: any, options?: any): Promise<WitnessCalculatorInterface> {
  return WithdrawWitnessCalculator(code, options);
}

/**
 * @function module:mystiko/protocol/v1.zkProve
 * @desc generate zkSnark proofs with given public and private inputs.
 * This function is using Groth16 zkSnark scheme for generating proofs.
 * @param {Buffer} pkVerify public key for zkp verification.
 * @param {Buffer} skVerify secret key for zkp verification.
 * @param {Buffer} pkEnc public key for asymmetric encryption.
 * @param {Buffer} skEnc secret key for asymmetric encryption.
 * @param {BN} amount the amount of the deposited asset.
 * @param {string} recipient the address of the recipient.
 * @param {BN} commitmentHash the commitment hash in the deposit transaction.
 * @param {Buffer} privateNote the encrypted on-chain private note, which include the value of
 * random secret P, random secret R, random secret S.
 * @param {BN[]} treeLeaves all existing commitment in same merkle tree, we treat it as
 * merkle tree leaves.
 * @param {number} treeIndex current commitment's index as a merkle tree leaf.
 * @param {string} wasmFile the path of zkSnark circuit file in WASM format.
 * @param {string} zkeyFile the path of zkSnark proving keys.
 * @returns {Promise<{publicSignals: string[], proof: {pi_a: string[], pi_b: string[][], pi_c: string[]}}>}
 * a calculated zkSnark proof.
 */
export async function zkProve(
  pkVerify: Buffer,
  skVerify: Buffer,
  pkEnc: Buffer,
  skEnc: Buffer,
  amount: BN,
  recipient: string,
  commitmentHash: BN,
  privateNote: Buffer,
  treeLeaves: BN[],
  treeIndex: number,
  wasmFile: string,
  zkeyFile: string,
): Promise<{ publicSignals: string[]; proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] } }> {
  logger.debug('start generating zkSnark proofs...');
  const decryptedNote = await decryptAsymmetric(skEnc, privateNote);
  check(decryptedNote.length === RANDOM_SK_SIZE * 3, 'decrypted note length is incorrect');
  const randomP = decryptedNote.slice(0, RANDOM_SK_SIZE);
  const randomR = decryptedNote.slice(RANDOM_SK_SIZE, RANDOM_SK_SIZE * 2);
  const randomS = decryptedNote.slice(RANDOM_SK_SIZE * 2);
  const computedCommitmentHash = await commitment(
    pkVerify,
    pkEnc,
    amount,
    buffToBigInt(randomP),
    buffToBigInt(randomR),
    buffToBigInt(randomS),
  );
  check(
    toHex(commitmentHash) === toHex(computedCommitmentHash.commitmentHash),
    'given commitmentHash does not match with other parameters',
  );
  const sn = serialNumber(skVerify, buffToBigInt(randomP));
  const tree = new MerkleTree(treeLeaves, { maxLevels: MERKLE_TREE_LEVELS });
  const { pathElements, pathIndices } = tree.path(treeIndex);
  const inputs = {
    // public inputs
    rootHash: tree.root(),
    serialNumber: sn.toString(),
    amount: amount.toString(),
    recipient: toBN(toHexNoPrefix(recipient), 16).toString(),
    // private inputs
    pathElements,
    pathIndices,
    publicKey: buffToBigInt(pkVerify).toString(),
    secretKey: buffToBigInt(skVerify).toString(),
    randomP: buffToBigInt(randomP).toString(),
    randomR: buffToBigInt(randomR).toString(),
    randomS: buffToBigInt(randomS).toString(),
    commitment: commitmentHash.toString(),
  };
  logger.debug(
    'calculating witness with public inputs:' +
      `rootHash='${toString(tree.root())}', ` +
      `serialNumber='${toString(serialNumber)}', ` +
      `amount="${toString(amount)}"'`,
  );
  const wasm = await readCompressedFile(wasmFile);
  const witnessCalculator = await WitnessCalculatorBuilder(wasm);
  const buff = await witnessCalculator.calculateWTNSBin(inputs, 0);
  logger.debug('witness calculation is done, start proving...');
  const zkey = await readCompressedFile(zkeyFile);
  const proofs = await groth16.prove(zkey, buff);
  logger.debug('zkSnark proof is generated successfully');
  return proofs;
}

/**
 * @function module:mystiko/protocol/v1.zkVerify
 * @desc verify the generated zkSnark proof locally with the given verification key.
 * @param {{pi_a: string[], pi_b: string[][], pi_c: string[]}} proof generated zkSnark proofs.
 * @param {string[]} publicSignals public inputs.
 * @param {string} verifyKeyFile path of zkSnark verification key file.
 * @returns {Promise<boolean>} a promise of true if it verifies successfully, otherwise it returns a promise of false.
 */
export async function zkVerify(
  proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] },
  publicSignals: string[],
  verifyKeyFile: string,
): Promise<boolean> {
  const vkey = await readJsonFile(verifyKeyFile);
  logger.debug('start verifying generated proofs...');
  const result = await groth16.verify(vkey, publicSignals, proof);
  logger.debug(`proof verification is done, result=${result}`);
  return result;
}
