import { randomBytes } from 'crypto';
import { pedersenHash, babyJub } from 'circomlib';
import * as utils from './utils.js';
import * as note from './model/note.js';

export function computePedersenHash(data) {
  const packed = pedersenHash.hash(data);
  const unpacked = babyJub.unpackPoint(packed);
  return Buffer.from(unpacked[0].toString(16), 'hex');
}

export function computeCommitment(verifyPublicKey, encPublicKey, amount, decimals) {
  const pkBuffer = Buffer.from(verifyPublicKey, 'hex');
  const amountBuffer = utils.bnToFixedBytes(utils.toDecimals(amount, decimals));
  const randomSecretP = randomBytes(note.RANDOM_SECRET_P_LEN);
  const randomSecretR = randomBytes(note.RANDOM_SECRET_R_LEN);
  const randomSecretS = randomBytes(note.RANDOM_SECRET_S_LEN);
  const k = computePedersenHash(Buffer.concat([pkBuffer, randomSecretP, randomSecretR]));
  const commitment = computePedersenHash(Buffer.concat([amountBuffer, k, randomSecretS]));
  const onchainNote = new note.OnchainNote({
    randomSecretP: randomSecretP.toString('hex'),
    randomSecretR: randomSecretR.toString('hex'),
    randomSecretS: randomSecretS.toString('hex'),
  });
  return {
    commitment: commitment.toString('hex'),
    encryptedNote: onchainNote.getEncryptedNote(encPublicKey),
  };
}
