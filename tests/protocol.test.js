import BN from 'bn.js';
import { randomBytes } from 'crypto';
import * as protocol from '../src/protocol.js';
import { OnchainNote } from '../src/model/note.js';

test('Test computeCommitment', () => {
  const fieldSize = new BN('21888242871839275222246405745257275088548364400416034343698204186575808495617');
  const verifyPk = '290bf80ac0b831e4401775abc4af18b437a9e39b167c6867d456ea60cc902900';
  const encPk = '03d28c79e8f5b70e86403e8343acb054fcd9a9966168cb0789d892d29969bc18bb';
  const encSk = 'cbf8bc2252bfdea62f2d320c20cc1a3237d6a419297a9ae5eda211988ce0f855';
  const { commitment, encryptedNote } = protocol.computeCommitment(verifyPk, encPk, 100);
  const onchainNote = OnchainNote.decryptNote(encSk, encryptedNote);
  expect(commitment).not.toBe(undefined);
  const commitmentBN = new BN(Buffer.from(commitment, 'hex'));
  expect(commitmentBN.lt(fieldSize)).toBe(true);
  expect(onchainNote.randomSecretP).not.toBe(undefined);
  expect(onchainNote.randomSecretR).not.toBe(undefined);
  expect(onchainNote.randomSecretS).not.toBe(undefined);
});

test('Test computePedersenHash', () => {
  for (let i = 0; i < 10; i++) {
    const hash = protocol.computePedersenHash(randomBytes(64));
    expect(hash.length).toBe(32);
  }
});
