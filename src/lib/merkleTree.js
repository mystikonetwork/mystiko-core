import BN from 'bn.js';
import { ethers } from 'ethers';
import { poseidon } from 'circomlibjs';
import { check, toHexNoPrefix } from '../utils.js';
import { FIELD_SIZE } from '../protocol';

export class MerkleTree {
  constructor(maxLevels, initialElements = [], { zeroElement = undefined } = {}) {
    check(typeof maxLevels === 'number', 'maxLevels should be a number');
    check(initialElements instanceof Array, 'initialElements should be an array');
    check(!zeroElement || zeroElement instanceof BN, 'zeroElement should be an instance of BN');
    initialElements.forEach((element) => {
      check(element instanceof BN, 'element should be an instance of BN');
    });
    this.maxLevels = maxLevels;
    this.capacity = 2 ** this.maxLevels;
    check(this.capacity >= initialElements.length, 'it exceeds the maximum allowed capacity');
    this.zeroElement = zeroElement ? zeroElement : MerkleTree.calcDefaultZeroElement();
    this.zeros = MerkleTree.calcZeros(this.zeroElement, this.maxLevels);
    this.layers = [];
    this.layers[0] = initialElements.slice();
    this._rebuild();
  }

  root() {
    return this.layers[this.maxLevels].length > 0
      ? this.layers[this.maxLevels][0]
      : this.zeros[this.maxLevels];
  }

  insert(element) {
    check(element instanceof BN, 'element should be an instance of BN');
    check(this.layers[0].length + 1 <= this.capacity, 'the tree is full');
    this.update(this.layers[0].length, element);
  }

  bulkInsert(elements) {
    check(elements instanceof Array, 'initialElements should be an array');
    elements.forEach((element) => {
      check(element instanceof BN, 'element should be an instance of BN');
    });
    check(this.layers[0].length + elements.length <= this.capacity, 'the tree is full');
    for (let i = 0; i < elements.length - 1; i++) {
      this.layers[0].push(elements[i]);
      let level = 0;
      let index = this.layers[0].length - 1;
      while (index % 2 === 1) {
        level++;
        index >>= 1;
        this.layers[level][index] = MerkleTree.hash2(
          this.layers[level - 1][index * 2],
          this.layers[level - 1][index * 2 + 1],
        );
      }
    }
    this.insert(elements[elements.length - 1]);
  }

  update(index, element) {
    check(typeof index === 'number', 'index should be a number');
    check(element instanceof BN, 'element should be an instance of BN');
    check(
      index >= 0 && index <= this.layers[0].length && index < this.capacity,
      `Insert index out of bounds: ${index}`,
    );
    this.layers[0][index] = element;
    for (let level = 1; level <= this.maxLevels; level++) {
      index >>= 1;
      this.layers[level][index] = MerkleTree.hash2(
        this.layers[level - 1][index * 2],
        index * 2 + 1 < this.layers[level - 1].length
          ? this.layers[level - 1][index * 2 + 1]
          : this.zeros[level - 1],
      );
    }
  }

  path(index) {
    check(typeof index === 'number', 'index should be a number');
    check(index >= 0 && index <= this.layers[0].length, `index out of bounds: ${index}`);
    const pathElements = [];
    const pathIndices = [];
    for (let level = 0; level < this.maxLevels; level++) {
      pathIndices[level] = index % 2;
      pathElements[level] =
        (index ^ 1) < this.layers[level].length ? this.layers[level][index ^ 1] : this.zeros[level];
      index >>= 1;
    }
    return {
      pathElements,
      pathIndices,
    };
  }

  elements() {
    return this.layers[0].slice();
  }

  indexOf(element, comparator) {
    check(element instanceof BN, 'element should be an instance of BN');
    check(comparator instanceof Function, 'comparator should be an instance of Function');
    if (comparator) {
      return this.layers[0].findIndex((el) => comparator(element, el));
    } else {
      return this.layers[0].indexOf(element);
    }
  }

  static hash2(first, second) {
    check(first instanceof BN, 'first must be an instance of BN');
    check(second instanceof BN, 'second must be an instance of BN');
    return new BN(poseidon([first, second]).toString());
  }

  static calcDefaultZeroElement() {
    // eslint-disable-next-line quotes
    const seedHash = ethers.utils.keccak256(Buffer.from("Welcome To Mystiko's Magic World!", 'ascii'));
    return new BN(toHexNoPrefix(seedHash), 16).mod(FIELD_SIZE);
  }

  static calcZeros(firstZero, levels) {
    check(firstZero instanceof BN, 'firstZero must be an instance of BN');
    check(typeof levels === 'number', 'levels should be a number');
    const zeros = [firstZero];
    for (let i = 1; i <= levels; i++) {
      zeros.push(MerkleTree.hash2(zeros[i - 1], zeros[i - 1]));
    }
    return zeros;
  }

  _rebuild() {
    for (let level = 1; level <= this.maxLevels; level++) {
      this.layers[level] = [];
      for (let i = 0; i < Math.ceil(this.layers[level - 1].length / 2); i++) {
        this.layers[level][i] = MerkleTree.hash2(
          this.layers[level - 1][i * 2],
          i * 2 + 1 < this.layers[level - 1].length
            ? this.layers[level - 1][i * 2 + 1]
            : this.zeros[level - 1],
        );
      }
    }
  }
}
