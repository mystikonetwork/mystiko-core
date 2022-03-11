import BN from 'bn.js';
import * as v1 from './v1/index';
import { MerkleTree } from '../merkle';

export interface V1ProtocolInterface {
  VERIFY_PK_SIZE: number;
  VERIFY_SK_SIZE: number;
  RANDOM_SK_SIZE: number;
  ENCRYPT_SK_SIZE: number;
  ENCRYPT_PK_SIZE: number;
  HASH_SIZE: number;
  MERKLE_TREE_LEVELS: number;
  buffToBigInt(buff: Buffer): BN;
  bigIntToBuff(bigInt: BN, numBytes: number): Buffer;
  randomBigInt(numBytes?: number): BN;
  randomBytes(numBytes?: number): Buffer;
  secretKeyForVerification(rawSecretKey: Buffer): Buffer;
  publicKeyForVerification(rawSecretKey: Buffer): Buffer;
  secretKeyForEncryption(rawSecretKey: Buffer): Buffer;
  publicKeyForEncryption(rawSecretKey: Buffer): Buffer;
  fullPublicKey(pkVerify: Buffer, pkEnc: Buffer): Buffer;
  fullSecretKey(skVerify: Buffer, skEnc: Buffer): Buffer;
  separatedPublicKeys(longPublicKey: Buffer): { pkEnc: Buffer; pkVerify: Buffer };
  separatedSecretKeys(longSecretKey: Buffer): { skVerify: Buffer; skEnc: Buffer };
  shieldedAddress(pkVerify: Buffer, pkEnc: Buffer): string;
  isShieldedAddress(address: string): boolean;
  publicKeysFromShieldedAddress(address: string): { pkEnc: Buffer; pkVerify: Buffer };
  encryptAsymmetric(publicKey: Buffer, plainData: Buffer): Promise<Buffer>;
  decryptAsymmetric(secretKey: Buffer, cipherData: Buffer): Promise<Buffer>;
  encryptSymmetric(password: string, plainText: string): string;
  decryptSymmetric(password: string, cipherText: string): string;
  sha256(inputs: Buffer[]): BN;
  poseidonHash(inputs: BN[]): BN;
  checkSum(data: string, salt?: string): string;
  commitment(
    pkVerify: Buffer,
    pkEnc: Buffer,
    amount: BN,
    randomP?: BN,
    randomR?: BN,
    randomS?: BN,
  ): Promise<{ privateNote: Buffer; randomS: BN; commitmentHash: BN; k: BN }>;
  commitmentWithShieldedAddress(
    shieldedRecipientAddress: string,
    amount: BN,
    randomP?: BN,
    randomR?: BN,
    randomS?: BN,
  ): Promise<{ privateNote: Buffer; randomS: BN; commitmentHash: BN; k: BN }>;
  serialNumber(skVerify: Buffer, randomP: BN): BN;
  WitnessCalculatorBuilder(code: any, options?: any): Promise<v1.WitnessCalculatorInterface>;
  zkProveWithdraw(
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
    wasmFile: string | string[],
    zkeyFile: string | string[],
  ): Promise<{ publicSignals: string[]; proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] } }>;
  zkProveRollup1(
    tree: MerkleTree,
    newLeaf: BN,
    wasmFile: string | string[],
    zkeyFile: string | string[],
  ): Promise<{ publicSignals: string[]; proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] } }>;
  zkProveRollup4(
    tree: MerkleTree,
    newLeaves: BN[],
    wasmFile: string | string[],
    zkeyFile: string | string[],
  ): Promise<{ publicSignals: string[]; proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] } }>;
  zkProveRollup16(
    tree: MerkleTree,
    newLeaves: BN[],
    wasmFile: string | string[],
    zkeyFile: string | string[],
  ): Promise<{ publicSignals: string[]; proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] } }>;
  zkVerify(
    proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] },
    publicSignals: string[],
    verifyKeyFile: string | string[],
  ): Promise<boolean>;
}

export const v1Protocol = v1 as V1ProtocolInterface;
export const currentProtocol = v1Protocol;
