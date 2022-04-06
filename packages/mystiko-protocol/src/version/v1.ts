/* eslint-disable class-methods-use-this */
import BN from 'bn.js';
import { WitnessCalculatorBuilder as WCBuilder } from 'circom_runtime';
import { ethers } from 'ethers';
import { groth16 } from 'snarkjs';
import { Proof } from 'zokrates-js';
import {
  check,
  FIELD_SIZE,
  logger,
  MerkleTree,
  readCompressedFile,
  readJsonFile,
  toBN,
  toBuff,
  toFixedLenHexNoPrefix,
  toHex,
  toHexNoPrefix,
  toString,
} from '@mystikonetwork/utils';
import { MystikoProtocol } from '../base';

interface WitnessCalculatorInterface {
  calculateWTNSBin(input: any, sanityCheck: any): Promise<Uint8Array>;
}

function WitnessCalculatorBuilder(code: any, options?: any): Promise<WitnessCalculatorInterface> {
  return WCBuilder(code, options);
}

export interface CommitmentArgsV1 {
  randomP?: BN;
  randomR?: BN;
  randomS?: BN;
}

export interface CommitmentV1 {
  privateNote: Buffer;
  randomP: BN;
  randomR: BN;
  randomS: BN;
  commitmentHash: BN;
  k: BN;
}

export interface TransactionV1 {
  pkVerify: Buffer;
  skVerify: Buffer;
  pkEnc: Buffer;
  skEnc: Buffer;
  amount: BN;
  recipient: string;
  commitmentHash: BN;
  privateNote: Buffer;
  treeRoot: BN;
  pathIndices: number[];
  pathElements: BN[];
  wasmFile: string | string[];
  zkeyFile: string | string[];
}

export interface RollupV1 {
  tree: MerkleTree;
  newLeaves: BN[];
  wasmFile: string | string[];
  zkeyFile: string | string[];
}

export class MystikoProtocolV1 extends MystikoProtocol<
  CommitmentArgsV1,
  CommitmentV1,
  TransactionV1,
  RollupV1
> {
  private txWC: WitnessCalculatorInterface | undefined = undefined;

  private rollupWCs: { [key: string]: WitnessCalculatorInterface } = {};

  public serialNumber(skVerify: Buffer, randomP: BN): BN {
    return this.poseidonHash([randomP, this.buffToBigInt(skVerify)]);
  }

  public async commitment(
    pkVerify: Buffer,
    pkEnc: Buffer,
    amount: BN,
    args?: CommitmentArgsV1,
  ): Promise<CommitmentV1> {
    const generatedRandomP = args?.randomP || this.randomBigInt(this.randomSkSize);
    const generatedRandomR = args?.randomR || this.randomBigInt(this.randomSkSize);
    const generatedRandomS = args?.randomS || this.randomBigInt(this.randomSkSize);
    const k = this.poseidonHash([this.buffToBigInt(pkVerify), generatedRandomP, generatedRandomR]);
    const commitmentHash = this.sha256([
      toBuff(toFixedLenHexNoPrefix(k)),
      toBuff(toFixedLenHexNoPrefix(amount)),
      toBuff(toFixedLenHexNoPrefix(generatedRandomS, this.randomSkSize)),
    ]);
    const privateNote = await this.encryptAsymmetric(
      pkEnc,
      Buffer.concat([
        this.bigIntToBuff(generatedRandomP, this.randomSkSize),
        this.bigIntToBuff(generatedRandomR, this.randomSkSize),
        this.bigIntToBuff(generatedRandomS, this.randomSkSize),
      ]),
    );
    logger.debug(
      'commitment generation is done:' +
        `commitmentHash='${toString(commitmentHash)}', ` +
        `randomS='${toString(generatedRandomS)}', ` +
        `privateNote='${toHex(privateNote)}'`,
    );
    return Promise.resolve({
      commitmentHash,
      k,
      randomP: generatedRandomP,
      randomR: generatedRandomR,
      randomS: generatedRandomS,
      privateNote,
    });
  }

  public async zkProveTransaction(tx: TransactionV1): Promise<Proof> {
    logger.debug('start generating zkSnark proofs...');
    const decryptedNote = await this.decryptAsymmetric(tx.skEnc, tx.privateNote);
    check(decryptedNote.length === this.randomSkSize * 3, 'decrypted note length is incorrect');
    const randomP = decryptedNote.slice(0, this.randomSkSize);
    const randomR = decryptedNote.slice(this.randomSkSize, this.randomSkSize * 2);
    const randomS = decryptedNote.slice(this.randomSkSize * 2);
    const computedCommitmentHash = await this.commitment(tx.pkVerify, tx.pkEnc, tx.amount, {
      randomP: this.buffToBigInt(randomP),
      randomR: this.buffToBigInt(randomR),
      randomS: this.buffToBigInt(randomS),
    });
    check(
      toHex(tx.commitmentHash) === toHex(computedCommitmentHash.commitmentHash),
      'given commitmentHash does not match with other parameters',
    );
    const sn = this.serialNumber(tx.skVerify, this.buffToBigInt(randomP));
    const inputs = {
      // public inputs
      rootHash: tx.treeRoot,
      serialNumber: sn.toString(),
      amount: tx.amount.toString(),
      recipient: toBN(toHexNoPrefix(tx.recipient), 16).toString(),
      // private inputs
      pathElements: tx.pathElements,
      pathIndices: tx.pathIndices,
      publicKey: this.buffToBigInt(tx.pkVerify).toString(),
      secretKey: this.buffToBigInt(tx.skVerify).toString(),
      randomP: this.buffToBigInt(randomP).toString(),
      randomR: this.buffToBigInt(randomR).toString(),
      randomS: this.buffToBigInt(randomS).toString(),
      commitment: tx.commitmentHash.toString(),
    };
    logger.debug(
      'calculating witness with public inputs:' +
        `rootHash='${toString(tx.treeRoot)}', ` +
        `serialNumber='${toString(sn)}', ` +
        `amount="${toString(tx.amount)}"'`,
    );
    const wasm = await readCompressedFile(tx.wasmFile);
    if (!this.txWC) {
      this.txWC = await WitnessCalculatorBuilder(wasm);
    }
    const buff = await this.txWC.calculateWTNSBin(inputs, 0);
    logger.debug('witness calculation is done, start proving...');
    const zkey = await readCompressedFile(tx.zkeyFile);
    const proofs = await groth16.prove(zkey, buff);
    logger.debug('zkSnark proof is generated successfully');
    return Promise.resolve({
      proof: {
        a: proofs.proof.pi_a,
        b: proofs.proof.pi_b,
        c: proofs.proof.pi_c,
      },
      inputs: proofs.publicSignals,
    });
  }

  public async zkProveRollup(rollup: RollupV1): Promise<Proof> {
    check(MystikoProtocolV1.isPowerOfTwo(rollup.newLeaves.length), 'newLeaves length should be power of 2');
    const rollupSize = rollup.newLeaves.length;
    const rollupHeight = Math.log2(rollupSize);
    const currentLeafCount = rollup.tree.elements().length;
    check(
      currentLeafCount % rollupSize === 0,
      `cannot rollup ${rollupSize} leaves when the tree has ${currentLeafCount} leaves`,
    );
    const currentRoot = rollup.tree.root();
    rollup.tree.bulkInsert(rollup.newLeaves);
    const newRoot = rollup.tree.root();
    const leafPath = rollup.tree.path(currentLeafCount);
    const pathIndices = MystikoProtocolV1.pathIndicesNumber(leafPath.pathIndices.slice(rollupHeight));
    const pathElements = leafPath.pathElements.slice(rollupHeight);
    const leafHash = MystikoProtocolV1.calcLeaveHash(rollup.newLeaves);
    const wasm = await readCompressedFile(rollup.wasmFile);
    const wcKey = rollup.wasmFile instanceof Array ? rollup.wasmFile.join(' ') : rollup.wasmFile;
    if (!this.rollupWCs[wcKey]) {
      this.rollupWCs[wcKey] = await WitnessCalculatorBuilder(wasm);
    }
    const buff = await this.rollupWCs[wcKey].calculateWTNSBin(
      {
        oldRoot: currentRoot.toString(),
        newRoot: newRoot.toString(),
        pathIndices: pathIndices.toString(),
        leafHash: leafHash.toString(),
        leaves: rollup.newLeaves.map((leaf) => leaf.toString()),
        pathElements: pathElements.map((element) => element.toString()),
      },
      0,
    );
    const zkey = await readCompressedFile(rollup.zkeyFile);
    const proofs = await groth16.prove(zkey, buff);
    return Promise.resolve({
      proof: {
        a: proofs.proof.pi_a,
        b: proofs.proof.pi_b,
        c: proofs.proof.pi_c,
      },
      inputs: proofs.publicSignals,
    });
  }

  public async zkVerify(proof: Proof, vkeyFile: string | string[]): Promise<boolean> {
    const vkey = await readJsonFile(vkeyFile);
    logger.debug('start verifying generated proofs...');
    const result = await groth16.verify(vkey, proof.inputs, {
      pi_a: proof.proof.a,
      pi_b: proof.proof.b,
      pi_c: proof.proof.c,
    });
    logger.debug(`proof verification is done, result=${result}`);
    return result;
  }

  private static calcLeaveHash(leaves: BN[]): BN {
    const leafBuffer = Buffer.concat(leaves.map((leaf) => Buffer.from(toFixedLenHexNoPrefix(leaf), 'hex')));
    return toBN(toHexNoPrefix(ethers.utils.sha256(leafBuffer)), 16).mod(FIELD_SIZE);
  }

  private static pathIndicesNumber(pathIndices: number[]): BN {
    return toBN(pathIndices.slice().reverse().join(''), 2);
  }

  private static isPowerOfTwo(aNumber: number): boolean {
    return aNumber !== 0 && (aNumber & (aNumber - 1)) === 0;
  }
}
