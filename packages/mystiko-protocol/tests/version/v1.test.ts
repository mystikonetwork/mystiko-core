import { MerkleTree, toBN, toDecimals } from '@mystikonetwork/utils';
import { MystikoProtocolV1 } from '../../src';

const v1Protocol = new MystikoProtocolV1();

test('test commitment', async () => {
  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.verifySkSize);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.encSkSize);
  const pkVerify = v1Protocol.publicKeyForVerification(rawSkVerify);
  const skEnc = v1Protocol.secretKeyForEncryption(rawSkEnc);
  const pkEnc = v1Protocol.publicKeyForEncryption(rawSkEnc);
  const amount = toDecimals(100, 18);
  const { commitmentHash, privateNote, k, randomS } = await v1Protocol.commitment(pkVerify, pkEnc, amount);
  expect(commitmentHash).not.toBe(undefined);
  expect(privateNote).not.toBe(undefined);
  expect(k).not.toBe(undefined);
  expect(randomS).not.toBe(undefined);
  const decryptedNote = await v1Protocol.decryptAsymmetric(skEnc, privateNote);
  expect(decryptedNote.length).toBe(v1Protocol.randomSkSize * 3);
});

test('test commitmentWithShieldedAddress', async () => {
  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.verifySkSize);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.encSkSize);
  const pkVerify = v1Protocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = v1Protocol.publicKeyForEncryption(rawSkEnc);
  const shieldedAddress = v1Protocol.shieldedAddress(pkVerify, pkEnc);
  const { commitmentHash, privateNote } = await v1Protocol.commitmentWithShieldedAddress(
    shieldedAddress,
    toBN(1),
  );
  expect(commitmentHash).not.toBe(undefined);
  expect(privateNote).not.toBe(undefined);
});

test('test zkProveWithdraw', async () => {
  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.verifySkSize);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.encSkSize);
  const pkVerify = v1Protocol.publicKeyForVerification(rawSkVerify);
  const skVerify = v1Protocol.secretKeyForVerification(rawSkVerify);
  const skEnc = v1Protocol.secretKeyForEncryption(rawSkEnc);
  const pkEnc = v1Protocol.publicKeyForEncryption(rawSkEnc);
  const amount = toDecimals(100, 18);
  const commitment1 = await v1Protocol.commitment(pkVerify, pkEnc, amount);
  const commitment2 = await v1Protocol.commitment(pkVerify, pkEnc, amount);
  const treeLeaves = [commitment1.commitmentHash, commitment2.commitmentHash];
  const treeIndex = 1;
  const merkleTree = new MerkleTree(treeLeaves, { maxLevels: v1Protocol.merkleTreeLevels });
  const { pathIndices, pathElements } = merkleTree.path(treeIndex);
  const wasmFile = 'node_modules/@mystikonetwork/circuits/dist/circom/dev/Withdraw.wasm.gz';
  const zkeyFile = 'node_modules/@mystikonetwork/circuits/dist/circom/dev/Withdraw.zkey.gz';
  const vkeyFile = 'node_modules/@mystikonetwork/circuits/dist/circom/dev/Withdraw.vkey.json.gz';
  const proof = await v1Protocol.zkProveTransaction({
    pkVerify,
    skVerify,
    pkEnc,
    skEnc,
    amount,
    recipient: '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
    commitmentHash: commitment2.commitmentHash,
    privateNote: commitment2.privateNote,
    treeRoot: merkleTree.root(),
    pathIndices,
    pathElements,
    wasmFile,
    zkeyFile,
  });
  let result = await v1Protocol.zkVerify(proof, vkeyFile);
  expect(result).toBe(true);
  proof.inputs[3] = '0x722122dF12D4e14e13Ac3b6895a86e84145b6967';
  result = await v1Protocol.zkVerify(proof, vkeyFile);
  expect(result).toBe(false);
});

test('test serialNumber', () => {
  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.verifySkSize);
  const skVerify = v1Protocol.secretKeyForVerification(rawSkVerify);
  const randomP = v1Protocol.randomBigInt(v1Protocol.randomSkSize);
  const serialNumber = v1Protocol.serialNumber(skVerify, randomP);
  expect(serialNumber).not.toBe(undefined);
});

test('test zkProveRollup1', async () => {
  const tree = new MerkleTree([toBN('100'), toBN('200'), toBN('300')], {
    maxLevels: v1Protocol.merkleTreeLevels,
  });
  const proof = await v1Protocol.zkProveRollup({
    tree,
    newLeaves: [toBN('1')],
    wasmFile: 'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup1.wasm.gz',
    zkeyFile: 'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup1.zkey.gz',
  });
  const verified = await v1Protocol.zkVerify(
    proof,
    'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup1.vkey.json.gz',
  );
  expect(verified).toBe(true);
  expect(tree.elements().length).toBe(4);
});

test('test zkProveRollup4', async () => {
  const tree = new MerkleTree([toBN('100'), toBN('200'), toBN('300'), toBN('400')], {
    maxLevels: v1Protocol.merkleTreeLevels,
  });
  const proof = await v1Protocol.zkProveRollup({
    tree,
    newLeaves: [toBN('1'), toBN('2'), toBN('3'), toBN('4')],
    wasmFile: 'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup4.wasm.gz',
    zkeyFile: 'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup4.zkey.gz',
  });
  const verified = await v1Protocol.zkVerify(
    proof,
    'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup4.vkey.json.gz',
  );
  expect(verified).toBe(true);
  expect(tree.elements().length).toBe(8);
  tree.insert(toBN(5));
  await expect(
    v1Protocol.zkProveRollup({
      tree,
      newLeaves: [toBN('6'), toBN('7'), toBN('8'), toBN('9')],
      wasmFile: 'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup4.wasm.gz',
      zkeyFile: 'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup4.zkey.gz',
    }),
  ).rejects.toThrow();
});

test('test zkProveRollup16', async () => {
  const tree = new MerkleTree(
    [
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
    ],
    {
      maxLevels: v1Protocol.merkleTreeLevels,
    },
  );
  const proof = await v1Protocol.zkProveRollup({
    tree,
    newLeaves: [
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
    wasmFile: 'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup16.wasm.gz',
    zkeyFile: 'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup16.zkey.gz',
  });
  const verified = await v1Protocol.zkVerify(
    proof,
    'node_modules/@mystikonetwork/circuits/dist/circom/dev/Rollup16.vkey.json.gz',
  );
  expect(verified).toBe(true);
  expect(tree.elements().length).toBe(32);
});
