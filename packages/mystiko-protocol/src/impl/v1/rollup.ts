import { ethers } from 'ethers';
import { groth16 } from 'snarkjs';
import BN from 'bn.js';
import { check, readCompressedFile, toBN, toFixedLenHexNoPrefix, toHexNoPrefix } from '@mystiko/utils';
import { FIELD_SIZE } from '../../constants';
import { MerkleTree } from '../../merkle';
import { WitnessCalculatorBuilder } from './common';

function calcLeaveHash(leaves: BN[]): BN {
  const leafBuffer = Buffer.concat(leaves.map((leaf) => Buffer.from(toFixedLenHexNoPrefix(leaf), 'hex')));
  return toBN(toHexNoPrefix(ethers.utils.sha256(leafBuffer)), 16).mod(FIELD_SIZE);
}

function pathIndicesNumber(pathIndices: number[]): BN {
  return toBN(pathIndices.slice().reverse().join(''), 2);
}

function isPowerOfTwo(aNumber: number): boolean {
  return aNumber !== 0 && (aNumber & (aNumber - 1)) === 0;
}

async function zkProve(tree: MerkleTree, newLeaves: BN[], wasmFile: string, zkeyFile: string) {
  check(isPowerOfTwo(newLeaves.length), 'newLeaves length should be power of 2');
  const rollupSize = newLeaves.length;
  const rollupHeight = Math.log2(rollupSize);
  const currentLeafCount = tree.elements().length;
  check(
    currentLeafCount % rollupSize === 0,
    `cannot rollup ${rollupSize} leaves when the tree has ${currentLeafCount} leaves`,
  );
  const currentRoot = tree.root();
  tree.bulkInsert(newLeaves);
  const newRoot = tree.root();
  const leafPath = tree.path(currentLeafCount);
  const pathIndices = pathIndicesNumber(leafPath.pathIndices.slice(rollupHeight));
  const pathElements = leafPath.pathElements.slice(rollupHeight);
  const leafHash = calcLeaveHash(newLeaves);
  const wasm = await readCompressedFile(wasmFile);
  const witnessCalculator = await WitnessCalculatorBuilder(wasm);
  const buff = await witnessCalculator.calculateWTNSBin(
    {
      oldRoot: currentRoot.toString(),
      newRoot: newRoot.toString(),
      pathIndices: pathIndices.toString(),
      leafHash: leafHash.toString(),
      leaves: newLeaves.map((leaf) => leaf.toString()),
      pathElements: pathElements.map((element) => element.toString()),
    },
    0,
  );
  const zkey = await readCompressedFile(zkeyFile);
  return groth16.prove(zkey, buff);
}

export function zkProveRollup1(
  tree: MerkleTree,
  newLeaf: BN,
  wasmFile: string,
  zkeyFile: string,
): Promise<{ publicSignals: string[]; proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] } }> {
  return zkProve(tree, [newLeaf], wasmFile, zkeyFile);
}

export function zkProveRollup4(
  tree: MerkleTree,
  newLeaves: BN[],
  wasmFile: string,
  zkeyFile: string,
): Promise<{ publicSignals: string[]; proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] } }> {
  check(newLeaves && newLeaves.length === 4, 'newLeaves length should be 4');
  return zkProve(tree, newLeaves, wasmFile, zkeyFile);
}

export function zkProveRollup16(
  tree: MerkleTree,
  newLeaves: BN[],
  wasmFile: string,
  zkeyFile: string,
): Promise<{ publicSignals: string[]; proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] } }> {
  check(newLeaves && newLeaves.length === 16, 'newLeaves length should be 16');
  return zkProve(tree, newLeaves, wasmFile, zkeyFile);
}
