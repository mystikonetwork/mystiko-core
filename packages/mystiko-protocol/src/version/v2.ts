import BN from 'bn.js';
import { ethers } from 'ethers';
import { CompilationArtifacts, Proof, VerificationKey, ZoKratesProvider } from 'zokrates-js';
import {
  check,
  FIELD_SIZE,
  logger,
  MerkleTree,
  readCompressedFile,
  readJsonFile,
  toBN,
  toFixedLenHexNoPrefix,
  toHex,
  toHexNoPrefix,
  toString,
} from '@mystikonetwork/utils';
import { CommitmentV1, CommitmentArgsV1, MystikoProtocolV1 } from './v1';
import { MystikoProtocol } from '../base';

export interface TransactionV2 {
  numInputs: number;
  numOutputs: number;
  inVerifyPks: Buffer[];
  inVerifySks: Buffer[];
  inEncPks: Buffer[];
  inEncSks: Buffer[];
  inAmounts: BN[];
  inCommitments: BN[];
  inPrivateNotes: Buffer[];
  pathIndices: number[][];
  pathElements: BN[][];
  sigPk: Buffer;
  treeRoot: BN;
  publicAmount: BN;
  relayerFeeAmount: BN;
  rollupFeeAmounts: BN[];
  outVerifyPks: Buffer[];
  outAmounts: BN[];
  outCommitments: BN[];
  outRandomPs: BN[];
  outRandomRs: BN[];
  outRandomSs: BN[];
  programFile: string | string[];
  abiFile: string | string[];
  provingKeyFile: string | string[];
}

export interface RollupV2 {
  tree: MerkleTree;
  newLeaves: BN[];
  programFile: string | string[];
  abiFile: string | string[];
  provingKeyFile: string | string[];
}

export class MystikoProtocolV2 extends MystikoProtocol<
  CommitmentArgsV1,
  CommitmentV1,
  TransactionV2,
  RollupV2
> {
  private readonly zokrates: ZoKratesProvider;

  private readonly v1Protocol: MystikoProtocolV1;

  constructor(zokrates: ZoKratesProvider) {
    super();
    this.zokrates = zokrates;
    this.v1Protocol = new MystikoProtocolV1();
  }

  public sigPkHash(sigPk: Buffer, secretKey: Buffer) {
    return this.poseidonHash([this.buffToBigInt(secretKey), toBN(sigPk)]);
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
    const commitmentHash = this.poseidonHash([k, amount, generatedRandomS]);
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

  public async zkProveTransaction(tx: TransactionV2): Promise<Proof> {
    logger.debug('start generating zkSnark proofs...');
    this.checkTransaction(tx);
    const inRandomPs: BN[] = [];
    const inRandomRs: BN[] = [];
    const inRandomSs: BN[] = [];
    const serialNumbers: BN[] = [];
    const sigHashes: BN[] = [];
    const decryptPromises: Promise<Buffer>[] = [];
    for (let i = 0; i < tx.numInputs; i += 1) {
      decryptPromises.push(this.decryptAsymmetric(tx.inEncSks[i], tx.inPrivateNotes[i]));
    }
    const decryptPrivateNotes = await Promise.all(decryptPromises);
    for (let i = 0; i < decryptPrivateNotes.length; i += 1) {
      const decryptPrivateNote = decryptPrivateNotes[i];
      check(decryptPrivateNote.length === this.randomSkSize * 3, 'decrypted note length is incorrect');
      const randomP = this.buffToBigInt(decryptPrivateNote.slice(0, this.randomSkSize));
      const randomR = this.buffToBigInt(decryptPrivateNote.slice(this.randomSkSize, this.randomSkSize * 2));
      const randomS = this.buffToBigInt(decryptPrivateNote.slice(this.randomSkSize * 2));
      inRandomPs.push(randomP);
      inRandomRs.push(randomR);
      inRandomSs.push(randomS);
      serialNumbers.push(this.v1Protocol.serialNumber(tx.inVerifySks[i], inRandomPs[i]));
      sigHashes.push(this.sigPkHash(tx.sigPk, tx.inVerifySks[i]));
    }
    const inputs: any[] = [
      tx.treeRoot.toString(),
      serialNumbers.map((bn) => bn.toString()),
      sigHashes.map((bn) => bn.toString()),
      toBN(tx.sigPk).toString(),
      tx.publicAmount.toString(),
      tx.relayerFeeAmount.toString(),
      tx.outCommitments.map((bn) => bn.toString()),
      tx.rollupFeeAmounts.map((bn) => bn.toString()),
      tx.inCommitments.map((bn) => bn.toString()),
      tx.inAmounts.map((bn) => bn.toString()),
      inRandomPs.map((bn) => bn.toString()),
      inRandomRs.map((bn) => bn.toString()),
      inRandomSs.map((bn) => bn.toString()),
      tx.inVerifySks.map((bn) => this.buffToBigInt(bn).toString()),
      tx.inVerifyPks.map((bn) => this.buffToBigInt(bn).toString()),
      tx.pathElements.map((bns) => bns.map((bn) => bn.toString())),
      tx.pathIndices.map((numbers) => numbers.map((n) => n !== 0)),
      tx.outAmounts.map((bn) => bn.toString()),
      tx.outRandomPs.map((bn) => bn.toString()),
      tx.outRandomRs.map((bn) => bn.toString()),
      tx.outRandomSs.map((bn) => bn.toString()),
      tx.outVerifyPks.map((bn) => this.buffToBigInt(bn).toString()),
    ];
    const program = await readCompressedFile(tx.programFile);
    const abi = await readJsonFile(tx.abiFile);
    const artifacts: CompilationArtifacts = { program, abi };
    const { witness } = this.zokrates.computeWitness(artifacts, inputs);
    logger.debug('witness calculation is done, start proving...');
    const provingKey = await readCompressedFile(tx.provingKeyFile);
    const proof = await this.zokrates.generateProof(program, witness, provingKey);
    logger.debug('zkSnark proof is generated successfully');
    return proof;
  }

  public async zkProveRollup(rollup: RollupV2): Promise<Proof> {
    check(MystikoProtocolV2.isPowerOfTwo(rollup.newLeaves.length), 'newLeaves length should be power of 2');
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
    const pathIndices = MystikoProtocolV2.pathIndicesNumber(leafPath.pathIndices.slice(rollupHeight));
    const pathElements = leafPath.pathElements.slice(rollupHeight);
    const leafHash = MystikoProtocolV2.calcLeaveHash(rollup.newLeaves);
    const inputs = [
      currentRoot.toString(),
      newRoot.toString(),
      leafHash.toString(),
      pathIndices.toString(),
      pathElements.map((bn) => bn.toString()),
      rollup.newLeaves.map((bn) => bn.toString()),
    ];
    const program = await readCompressedFile(rollup.programFile);
    const abi = await readJsonFile(rollup.abiFile);
    const artifacts: CompilationArtifacts = { program, abi };
    const { witness } = this.zokrates.computeWitness(artifacts, inputs);
    const provingKey = await readCompressedFile(rollup.provingKeyFile);
    return this.zokrates.generateProof(program, witness, provingKey);
  }

  public async zkVerify(proof: Proof, vkeyFile: string | string[]): Promise<boolean> {
    const vkey: VerificationKey = (await readJsonFile(vkeyFile)) as VerificationKey;
    logger.debug('start verifying generated proofs...');
    const result = this.zokrates.verify(vkey, proof);
    logger.debug(`proof verification is done, result=${result}`);
    return Promise.resolve(result);
  }

  private checkTransaction(tx: TransactionV2): void {
    check(tx.numInputs === tx.inVerifyPks.length, `inVerifyPks length does not equal to ${tx.numInputs}`);
    check(tx.numInputs === tx.inVerifySks.length, `inVerifySks length does not equal to ${tx.numInputs}`);
    check(tx.numInputs === tx.inEncPks.length, `inEncPks length does not equal to ${tx.numInputs}`);
    check(tx.numInputs === tx.inEncSks.length, `inEncSks length does not equal to ${tx.numInputs}`);
    check(tx.numInputs === tx.inAmounts.length, `inAmounts length does not equal to ${tx.numInputs}`);
    check(tx.numInputs === tx.inCommitments.length, `inCommitments length does not equal to ${tx.numInputs}`);
    check(
      tx.numInputs === tx.inPrivateNotes.length,
      `inPrivateNotes length does not equal to ${tx.numInputs}`,
    );
    check(tx.numInputs === tx.pathIndices.length, `pathIndices length does not equal to ${tx.numInputs}`);
    check(tx.numInputs === tx.pathElements.length, `pathElements length does not equal to ${tx.numInputs}`);
    check(
      tx.numOutputs === tx.rollupFeeAmounts.length,
      `rollupFeeAmounts length does not equal to ${tx.numOutputs}`,
    );
    check(tx.numOutputs === tx.outVerifyPks.length, `outVerifyPks length does not equal to ${tx.numOutputs}`);
    check(
      tx.numOutputs === tx.outCommitments.length,
      `outCommitments length does not equal to ${tx.numOutputs}`,
    );
    check(tx.numOutputs === tx.outRandomPs.length, `outRandomPs length does not equal to ${tx.numOutputs}`);
    check(tx.numOutputs === tx.outRandomRs.length, `outRandomRs length does not equal to ${tx.numOutputs}`);
    check(tx.numOutputs === tx.outRandomSs.length, `outRandomSs length does not equal to ${tx.numOutputs}`);
    check(tx.numOutputs === tx.outAmounts.length, `outAmounts length does not equal to ${tx.numOutputs}`);
    tx.pathIndices.forEach((pathIndices) => {
      check(
        this.merkleTreeLevels === pathIndices.length,
        `pathIndices length does not equal to ${this.merkleTreeLevels}`,
      );
    });
    tx.pathElements.forEach((pathElements) => {
      check(
        this.merkleTreeLevels === pathElements.length,
        `pathElements length does not equal to ${this.merkleTreeLevels}`,
      );
    });
  }

  private static isPowerOfTwo(aNumber: number): boolean {
    return aNumber !== 0 && (aNumber & (aNumber - 1)) === 0;
  }

  private static pathIndicesNumber(pathIndices: number[]): BN {
    return toBN(pathIndices.slice().join(''), 2);
  }

  private static calcLeaveHash(leaves: BN[]): BN {
    const leafBuffer = Buffer.concat(leaves.map((leaf) => Buffer.from(toFixedLenHexNoPrefix(leaf), 'hex')));
    return toBN(toHexNoPrefix(ethers.utils.keccak256(leafBuffer)), 16).mod(FIELD_SIZE);
  }
}
