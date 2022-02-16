import BN from 'bn.js';
import { zkProveRollup1, zkProveRollup4, zkProveRollup16 } from '../../src/rollup/protocol.js';
import { MerkleTree } from '../../src/lib/merkleTree.js';
import { zkVerify } from '../../src/protocol';

test('test zkProveRollup1', async () => {
  const tree = new MerkleTree(20, [new BN('100'), new BN('200'), new BN('300')]);
  console.time('zkProveRollup1');
  const { proof, publicSignals } = await zkProveRollup1(
    tree,
    new BN('1'),
    'dist/circom/dev/Rollup1.wasm.gz',
    'dist/circom/dev/Rollup1.zkey.gz',
  );
  console.timeEnd('zkProveRollup1');
  const verified = await zkVerify(proof, publicSignals, 'dist/circom/dev/Rollup1.vkey.json.gz');
  expect(verified).toBe(true);
  expect(tree.elements().length).toBe(4);
});

test('test zkProveRollup4', async () => {
  const tree = new MerkleTree(20, [new BN('100'), new BN('200'), new BN('300'), new BN('400')]);
  console.time('zkProveRollup4');
  const { proof, publicSignals } = await zkProveRollup4(
    tree,
    [new BN('1'), new BN('2'), new BN('3'), new BN('4')],
    'dist/circom/dev/Rollup4.wasm.gz',
    'dist/circom/dev/Rollup4.zkey.gz',
  );
  console.timeEnd('zkProveRollup4');
  const verified = await zkVerify(proof, publicSignals, 'dist/circom/dev/Rollup4.vkey.json.gz');
  expect(verified).toBe(true);
  expect(tree.elements().length).toBe(8);
  tree.insert(new BN(5));
  await expect(
    zkProveRollup4(
      tree,
      [new BN('6'), new BN('7'), new BN('8'), new BN('9')],
      'dist/circom/dev/Rollup4.wasm.gz',
      'dist/circom/dev/Rollup4.zkey.gz',
    ),
  ).rejects.toThrow();
});

test('test zkProveRollup16', async () => {
  const tree = new MerkleTree(20, [
    new BN('100'),
    new BN('200'),
    new BN('300'),
    new BN('400'),
    new BN('500'),
    new BN('600'),
    new BN('700'),
    new BN('800'),
    new BN('900'),
    new BN('1000'),
    new BN('1100'),
    new BN('1200'),
    new BN('1300'),
    new BN('1400'),
    new BN('1500'),
    new BN('1600'),
  ]);
  console.time('zkProveRollup16');
  const { proof, publicSignals } = await zkProveRollup16(
    tree,
    [
      new BN('1'),
      new BN('2'),
      new BN('3'),
      new BN('4'),
      new BN('5'),
      new BN('6'),
      new BN('7'),
      new BN('8'),
      new BN('9'),
      new BN('10'),
      new BN('11'),
      new BN('12'),
      new BN('13'),
      new BN('14'),
      new BN('15'),
      new BN('16'),
    ],
    'dist/circom/dev/Rollup16.wasm.gz',
    'dist/circom/dev/Rollup16.zkey.gz',
  );
  console.timeEnd('zkProveRollup16');
  const verified = await zkVerify(proof, publicSignals, 'dist/circom/dev/Rollup16.vkey.json.gz');
  expect(verified).toBe(true);
  expect(tree.elements().length).toBe(32);
});
