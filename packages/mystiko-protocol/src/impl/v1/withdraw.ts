import BN from 'bn.js';
import { groth16 } from 'snarkjs';
import { check, logger, readCompressedFile, toBN, toHex, toHexNoPrefix, toString } from '@mystiko/utils';
import { MerkleTree } from '../../merkle';
import {
  buffToBigInt,
  commitment,
  decryptAsymmetric,
  MERKLE_TREE_LEVELS,
  RANDOM_SK_SIZE,
  serialNumber,
  WitnessCalculatorBuilder,
  WitnessCalculatorInterface,
} from './common';

let witnessCalculator: WitnessCalculatorInterface;

/**
 * @function module:mystiko/protocol/v1.zkProveWithdraw
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
/* eslint-disable-next-line import/prefer-default-export */
export async function zkProveWithdraw(
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
  if (!witnessCalculator) {
    witnessCalculator = await WitnessCalculatorBuilder(wasm);
  }
  const buff = await witnessCalculator.calculateWTNSBin(inputs, 0);
  logger.debug('witness calculation is done, start proving...');
  const zkey = await readCompressedFile(zkeyFile);
  const proofs = await groth16.prove(zkey, buff);
  logger.debug('zkSnark proof is generated successfully');
  return proofs;
}
