import BN from 'bn.js';
import { ethers } from 'ethers';
import { groth16 } from 'snarkjs';
import { check, readFile, toFixedLenHexNoPrefix, toHexNoPrefix } from '../utils.js';
import { MerkleTree } from '../lib/merkleTree.js';
import { FIELD_SIZE } from '../protocol';

const Rollup1WitnessCalculator = require('../protocol/generated/rollup1_witness_calculator.js');
const Rollup4WitnessCalculator = require('../protocol/generated/rollup4_witness_calculator.js');
const Rollup16WitnessCalculator = require('../protocol/generated/rollup16_witness_calculator.js');

export function zkProveRollup1(tree, newLeaf, wasmFile, zkeyFile) {
  return _zkProve({
    tree,
    newLeaves: [newLeaf],
    wasmFile,
    zkeyFile,
    WitnessCalculator: Rollup1WitnessCalculator,
  });
}

export function zkProveRollup4(tree, newLeaves, wasmFile, zkeyFile) {
  check(newLeaves && newLeaves.length === 4, 'newLeaves length should be 4');
  return _zkProve({
    tree,
    newLeaves,
    wasmFile,
    zkeyFile,
    WitnessCalculator: Rollup4WitnessCalculator,
  });
}

export function zkProveRollup16(tree, newLeaves, wasmFile, zkeyFile) {
  check(newLeaves && newLeaves.length === 16, 'newLeaves length should be 16');
  return _zkProve({
    tree,
    newLeaves,
    wasmFile,
    zkeyFile,
    WitnessCalculator: Rollup16WitnessCalculator,
  });
}

async function _zkProve({ tree, newLeaves, wasmFile, zkeyFile, WitnessCalculator }) {
  check(tree instanceof MerkleTree, 'tree should be instance of MerkleTree');
  check(newLeaves instanceof Array, 'newLeaves should be an array');
  newLeaves.forEach((newLeave) => check(newLeave instanceof BN, 'newLeave should be instance of BN'));
  check(_isPowerOfTwo(newLeaves.length), 'newLeaves length should be power of 2');
  check(typeof wasmFile === 'string', 'wasmFile should be a string');
  check(typeof zkeyFile === 'string', 'zkeyFile should be a string');
  check(WitnessCalculator, 'witnessCalculator cannot be undefined or null');
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
  const pathIndices = _pathIndicesNumber(leafPath.pathIndices.slice(rollupHeight));
  const pathElements = leafPath.pathElements.slice(rollupHeight);
  const leafHash = _calcLeaveHash(newLeaves);
  const wasm = await readFile(wasmFile);
  const witnessCalculator = await WitnessCalculator(wasm);
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
  return await groth16.prove(zkeyFile, buff);
}

function _calcLeaveHash(leaves) {
  const leafBuffer = Buffer.concat(leaves.map((leaf) => Buffer.from(toFixedLenHexNoPrefix(leaf), 'hex')));
  return new BN(toHexNoPrefix(ethers.utils.sha256(leafBuffer)), 16).mod(FIELD_SIZE);
}

function _pathIndicesNumber(pathIndices) {
  return new BN(pathIndices.slice().reverse().join(''), 2);
}

function _isPowerOfTwo(number) {
  return number !== 0 && (number & (number - 1)) === 0;
}
