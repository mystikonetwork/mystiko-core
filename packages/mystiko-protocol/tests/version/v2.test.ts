import BN from 'bn.js';
import { ethers } from 'ethers';
import { MerkleTree, toBN, toDecimals, toHexNoPrefix } from '@mystikonetwork/utils';
import { CommitmentV1, MystikoProtocolV2, TransactionV2 } from '../../src';

async function generateTransaction(
  protocol: MystikoProtocolV2,
  numInputs: number,
  numOutputs: number,
  programFile: string,
  abiFile: string,
  provingKeyFile: string,
): Promise<TransactionV2> {
  const inVerifyPks: Buffer[] = [];
  const inVerifySks: Buffer[] = [];
  const inEncPks: Buffer[] = [];
  const inEncSks: Buffer[] = [];
  const inAmounts: BN[] = [];
  for (let i = 0; i < numInputs; i += 1) {
    const rawVerifySk = protocol.randomBytes(protocol.verifySkSize);
    const rawEncSk = protocol.randomBytes(protocol.encSkSize);
    inVerifySks.push(protocol.secretKeyForVerification(rawVerifySk));
    inVerifyPks.push(protocol.publicKeyForVerification(rawVerifySk));
    inEncSks.push(protocol.secretKeyForEncryption(rawEncSk));
    inEncPks.push(protocol.publicKeyForEncryption(rawEncSk));
    inAmounts.push(toDecimals(200));
  }
  const inCommitmentsPromises: Promise<CommitmentV1>[] = [];
  for (let i = 0; i < numInputs; i += 1) {
    inCommitmentsPromises.push(protocol.commitment(inVerifyPks[i], inEncPks[i], inAmounts[i]));
  }
  const inCommitmentsAll = await Promise.all(inCommitmentsPromises);
  const inCommitments = inCommitmentsAll.map((all) => all.commitmentHash);
  const inPrivateNotes = inCommitmentsAll.map((all) => all.privateNote);
  const merkleTree = new MerkleTree(inCommitments, { maxLevels: protocol.merkleTreeLevels });
  const allPaths: { pathElements: BN[]; pathIndices: number[] }[] = [];
  for (let i = 0; i < inCommitments.length; i += 1) {
    allPaths.push(merkleTree.path(i));
  }
  const pathIndices = allPaths.map((all) => all.pathIndices);
  const pathElements = allPaths.map((all) => all.pathElements);
  const randomWallet = ethers.Wallet.createRandom();
  const sigPk = Buffer.from(toHexNoPrefix(randomWallet.address), 'hex');
  const relayerFeeAmount = toDecimals(10);
  const rollupFeeAmounts: BN[] = [];
  const outAmounts: BN[] = [];
  const outVerifyPks: Buffer[] = [];
  const outEncPks: Buffer[] = [];
  for (let i = 0; i < numOutputs; i += 1) {
    const rawVerifySk = protocol.randomBytes(protocol.verifySkSize);
    const rawEncSk = protocol.randomBytes(protocol.encSkSize);
    const verifyPk = protocol.publicKeyForVerification(rawVerifySk);
    const encPk = protocol.publicKeyForEncryption(rawEncSk);
    outVerifyPks.push(verifyPk);
    outEncPks.push(encPk);
    outAmounts.push(toDecimals(50));
    rollupFeeAmounts.push(toDecimals(10));
  }
  const outCommitmentPromises: Promise<CommitmentV1>[] = [];
  for (let i = 0; i < numOutputs; i += 1) {
    outCommitmentPromises.push(protocol.commitment(outVerifyPks[i], outEncPks[i], outAmounts[i]));
  }
  const outCommitmentsAll = await Promise.all(outCommitmentPromises);
  const outCommitments = outCommitmentsAll.map((all) => all.commitmentHash);
  const outRandomPs = outCommitmentsAll.map((all) => all.randomP);
  const outRandomRs = outCommitmentsAll.map((all) => all.randomR);
  const outRandomSs = outCommitmentsAll.map((all) => all.randomS);
  const publicAmount = inAmounts
    .reduce((a, b) => a.add(b), new BN(0))
    .sub(outAmounts.reduce((a, b) => a.add(b), new BN(0)))
    .sub(rollupFeeAmounts.reduce((a, b) => a.add(b), new BN(0)))
    .sub(relayerFeeAmount);
  return {
    numInputs,
    numOutputs,
    inVerifySks,
    inVerifyPks,
    inEncSks,
    inEncPks,
    inAmounts,
    inCommitments,
    inPrivateNotes,
    pathIndices,
    pathElements,
    sigPk,
    treeRoot: merkleTree.root(),
    publicAmount,
    relayerFeeAmount,
    rollupFeeAmounts,
    outVerifyPks,
    outCommitments,
    outRandomPs,
    outRandomRs,
    outRandomSs,
    outAmounts,
    programFile,
    abiFile,
    provingKeyFile,
  };
}

let protocol: MystikoProtocolV2;

beforeAll(async () => {
  // eslint-disable-next-line global-require
  const { initialize } = require('zokrates-js/node');
  const zokrates = await initialize();
  protocol = new MystikoProtocolV2(zokrates);
});

test('test Transaction1x0', async () => {
  const tx = await generateTransaction(
    protocol,
    1,
    0,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x0.program.gz',
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x0.abi.json',
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x0.pkey.gz',
  );
  const proof = await protocol.zkProveTransaction(tx);
  const result = await protocol.zkVerify(
    proof,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x0.vkey.gz',
  );
  expect(result).toBe(true);
});

test('test Transaction1x1', async () => {
  const tx = await generateTransaction(
    protocol,
    1,
    1,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x1.program.gz',
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x1.abi.json',
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x1.pkey.gz',
  );
  const proof = await protocol.zkProveTransaction(tx);
  const result = await protocol.zkVerify(
    proof,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x1.vkey.gz',
  );
  expect(result).toBe(true);
});

test('test Transaction1x2', async () => {
  const tx = await generateTransaction(
    protocol,
    1,
    2,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x2.program.gz',
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x2.abi.json',
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x2.pkey.gz',
  );
  const proof = await protocol.zkProveTransaction(tx);
  const result = await protocol.zkVerify(
    proof,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x2.vkey.gz',
  );
  expect(result).toBe(true);
});

test('test Transaction2x0', async () => {
  const tx = await generateTransaction(
    protocol,
    2,
    0,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x0.program.gz',
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x0.abi.json',
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x0.pkey.gz',
  );
  const proof = await protocol.zkProveTransaction(tx);
  const result = await protocol.zkVerify(
    proof,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x0.vkey.gz',
  );
  expect(result).toBe(true);
});

test('test Transaction2x1', async () => {
  const tx = await generateTransaction(
    protocol,
    2,
    1,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x1.program.gz',
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x1.abi.json',
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x1.pkey.gz',
  );
  const proof = await protocol.zkProveTransaction(tx);
  const result = await protocol.zkVerify(
    proof,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x1.vkey.gz',
  );
  expect(result).toBe(true);
});

test('test Transaction2x2', async () => {
  const tx = await generateTransaction(
    protocol,
    2,
    2,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x2.program.gz',
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x2.abi.json',
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x2.pkey.gz',
  );
  const proof = await protocol.zkProveTransaction(tx);
  const result = await protocol.zkVerify(
    proof,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x2.vkey.gz',
  );
  expect(result).toBe(true);
});

test('test zkProveRollup1', async () => {
  const tree = new MerkleTree([toBN('100'), toBN('200'), toBN('300')], {
    maxLevels: protocol.merkleTreeLevels,
  });
  const proof = await protocol.zkProveRollup({
    tree,
    newLeaves: [toBN('1')],
    programFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup1.program.gz',
    abiFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup1.abi.json',
    provingKeyFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup1.pkey.gz',
  });
  const verified = await protocol.zkVerify(
    proof,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup1.vkey.gz',
  );
  expect(verified).toBe(true);
  expect(tree.elements().length).toBe(4);
});

test('test zkProveRollup4', async () => {
  const tree = new MerkleTree([toBN('100'), toBN('200'), toBN('300'), toBN('400')], {
    maxLevels: protocol.merkleTreeLevels,
  });
  const proof = await protocol.zkProveRollup({
    tree,
    newLeaves: [toBN('1'), toBN('2'), toBN('3'), toBN('4')],
    programFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup4.program.gz',
    abiFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup4.abi.json',
    provingKeyFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup4.pkey.gz',
  });
  const verified = await protocol.zkVerify(
    proof,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup4.vkey.gz',
  );
  expect(verified).toBe(true);
  expect(tree.elements().length).toBe(8);
  tree.insert(toBN(5));
  await expect(
    protocol.zkProveRollup({
      tree,
      newLeaves: [toBN('6'), toBN('7'), toBN('8'), toBN('9')],
      programFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup4.program.gz',
      abiFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup4.abi.json',
      provingKeyFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup4.pkey.gz',
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
      maxLevels: protocol.merkleTreeLevels,
    },
  );
  const proof = await protocol.zkProveRollup({
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
    programFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup16.program.gz',
    abiFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup16.abi.json',
    provingKeyFile: 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup16.pkey.gz',
  });
  const verified = await protocol.zkVerify(
    proof,
    'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Rollup16.vkey.gz',
  );
  expect(verified).toBe(true);
  expect(tree.elements().length).toBe(32);
});
