import { MerkleTree, v1Protocol } from '@mystiko/protocol';
import { toBN } from '@mystiko/utils';
import { zkProveRollup1, zkProveRollup4, zkProveRollup16 } from '../../src/rollup/protocol.js';

test('test zkProveRollup1', async () => {
  const tree = new MerkleTree([toBN('100'), toBN('200'), toBN('300')]);
  console.time('zkProveRollup1');
  const { proof, publicSignals } = await zkProveRollup1(
    tree,
    toBN('1'),
    'node_modules/@mystiko/circuits/dist/circom/dev/Rollup1.wasm.gz',
    'node_modules/@mystiko/circuits/dist/circom/dev/Rollup1.zkey.gz',
  );
  console.timeEnd('zkProveRollup1');
  const verified = await v1Protocol.zkVerify(
    proof,
    publicSignals,
    'node_modules/@mystiko/circuits/dist/circom/dev/Rollup1.vkey.json.gz',
  );
  expect(verified).toBe(true);
  expect(tree.elements().length).toBe(4);
});

test('test zkProveRollup4', async () => {
  const tree = new MerkleTree([toBN('100'), toBN('200'), toBN('300'), toBN('400')]);
  console.time('zkProveRollup4');
  const { proof, publicSignals } = await zkProveRollup4(
    tree,
    [toBN('1'), toBN('2'), toBN('3'), toBN('4')],
    'node_modules/@mystiko/circuits/dist/circom/dev/Rollup4.wasm.gz',
    'node_modules/@mystiko/circuits/dist/circom/dev/Rollup4.zkey.gz',
  );
  console.timeEnd('zkProveRollup4');
  const verified = await v1Protocol.zkVerify(
    proof,
    publicSignals,
    'node_modules/@mystiko/circuits/dist/circom/dev/Rollup4.vkey.json.gz',
  );
  expect(verified).toBe(true);
  expect(tree.elements().length).toBe(8);
  tree.insert(toBN(5));
  await expect(
    zkProveRollup4(
      tree,
      [toBN('6'), toBN('7'), toBN('8'), toBN('9')],
      'node_modules/@mystiko/circuits/dist/circom/dev/Rollup4.wasm.gz',
      'node_modules/@mystiko/circuits/dist/circom/dev/Rollup4.zkey.gz',
    ),
  ).rejects.toThrow();
});

test('test zkProveRollup16', async () => {
  const tree = new MerkleTree([
    toBN('100'),
    toBN('200'),
    toBN('300'),
    toBN('400'),
    toBN('500'),
    toBN('600'),
    toBN('700'),
    toBN('800'),
    toBN('900'),
    toBN('1000'),
    toBN('1100'),
    toBN('1200'),
    toBN('1300'),
    toBN('1400'),
    toBN('1500'),
    toBN('1600'),
  ]);
  console.time('zkProveRollup16');
  const { proof, publicSignals } = await zkProveRollup16(
    tree,
    [
      toBN('1'),
      toBN('2'),
      toBN('3'),
      toBN('4'),
      toBN('5'),
      toBN('6'),
      toBN('7'),
      toBN('8'),
      toBN('9'),
      toBN('10'),
      toBN('11'),
      toBN('12'),
      toBN('13'),
      toBN('14'),
      toBN('15'),
      toBN('16'),
    ],
    'node_modules/@mystiko/circuits/dist/circom/dev/Rollup16.wasm.gz',
    'node_modules/@mystiko/circuits/dist/circom/dev/Rollup16.zkey.gz',
  );
  console.timeEnd('zkProveRollup16');
  const verified = await v1Protocol.zkVerify(
    proof,
    publicSignals,
    'node_modules/@mystiko/circuits/dist/circom/dev/Rollup16.vkey.json.gz',
  );
  expect(verified).toBe(true);
  expect(tree.elements().length).toBe(32);
});
