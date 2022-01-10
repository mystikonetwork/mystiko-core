import { encrypt, decrypt } from 'eciesjs';
import { BaseModel } from './common.js';

export const RANDOM_SECRET_P_LEN = 16;
export const RANDOM_SECRET_R_LEN = 16;
export const RANDOM_SECRET_S_LEN = 16;
export const ONCHAIN_NOTE_LEN = RANDOM_SECRET_P_LEN + RANDOM_SECRET_R_LEN + RANDOM_SECRET_S_LEN;
export class OnchainNote extends BaseModel {
  constructor(data = {}) {
    super(data);
    OnchainNote.checkRandomSecretP(this.randomSecretP);
    OnchainNote.checkRandomSecretR(this.randomSecretR);
    OnchainNote.checkRandomSecretS(this.randomSecretS);
  }

  get randomSecretP() {
    return this.data['randomSecretP'];
  }

  set randomSecretP(secret) {
    OnchainNote.checkRandomSecretP(secret);
    this.data['randomSecretP'] = secret;
  }

  get randomSecretR() {
    return this.data['randomSecretR'];
  }

  set randomSecretR(secret) {
    OnchainNote.checkRandomSecretR(secret);
    this.data['randomSecretR'] = secret;
  }

  get randomSecretS() {
    return this.data['randomSecretS'];
  }

  set randomSecretS(secret) {
    OnchainNote.checkRandomSecretS(secret);
    this.data['randomSecretS'] = secret;
  }

  get bytes() {
    if (this.randomSecretP && this.randomSecretR && this.randomSecretS) {
      return Buffer.concat([
        Buffer.from(this.randomSecretP, 'hex'),
        Buffer.from(this.randomSecretR, 'hex'),
        Buffer.from(this.randomSecretS, 'hex'),
      ]);
    }
    return undefined;
  }

  getEncryptedNote(publicKeyHex) {
    if (this.randomSecretP && this.randomSecretR && this.randomSecretS) {
      const fullBytes = Buffer.concat([
        Buffer.from(this.randomSecretP, 'hex'),
        Buffer.from(this.randomSecretR, 'hex'),
        Buffer.from(this.randomSecretS, 'hex'),
      ]);
      return encrypt(publicKeyHex, fullBytes).toString('hex');
    }
    return undefined;
  }

  static checkRandomSecretP(p) {
    if (p && p.length !== RANDOM_SECRET_P_LEN * 2) {
      throw 'invalid random secret p hex string';
    }
  }

  static checkRandomSecretR(r) {
    if (r && r.length !== RANDOM_SECRET_R_LEN * 2) {
      throw 'invalid random secret r hex string';
    }
  }

  static checkRandomSecretS(s) {
    if (s && s.length !== RANDOM_SECRET_S_LEN * 2) {
      throw 'invalid random secret s hex string';
    }
  }

  static decryptNote(secretKeyHex, encryptedNote) {
    const decrypted = decrypt(secretKeyHex, Buffer.from(encryptedNote, 'hex'));
    const onchainNote = new OnchainNote({
      randomSecretP: decrypted.slice(0, RANDOM_SECRET_P_LEN).toString('hex'),
      randomSecretR: decrypted
        .slice(RANDOM_SECRET_P_LEN, RANDOM_SECRET_P_LEN + RANDOM_SECRET_R_LEN)
        .toString('hex'),
      randomSecretS: decrypted
        .slice(RANDOM_SECRET_P_LEN + RANDOM_SECRET_R_LEN, ONCHAIN_NOTE_LEN)
        .toString('hex'),
    });
    return onchainNote;
  }
}

export class OffchainNote extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  get chainId() {
    return this.data['chainId'];
  }

  set chainId(id) {
    this.data['chainId'] = id;
  }

  get transactionHash() {
    return this.data['transactionHash'];
  }

  set transactionHash(hash) {
    this.data['transactionHash'] = hash;
  }

  get bytes() {
    return Buffer.from(JSON.stringify(this.data));
  }

  getEncryptedNote(publicKeyHex) {
    return encrypt(publicKeyHex, this.bytes).toString('hex');
  }

  static decryptNote(secretKeyHex, encryptedNote) {
    const decrypted = decrypt(secretKeyHex, Buffer.from(encryptedNote, 'hex'));
    const data = JSON.parse(decrypted.toString());
    return new OffchainNote(data);
  }
}

export class PrivateNote extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  get srcChainId() {
    return this.data['srcChainId'];
  }

  set srcChainId(id) {
    this.data['srcChainId'] = id;
  }

  get srcTransactionHash() {
    return this.data['srcTransactionHash'];
  }

  set srcTransactionHash(hash) {
    this.data['srcTransactionHash'] = hash;
  }

  get srcToken() {
    return this.data['srcToken'];
  }

  set srcToken(token) {
    this.data['srcToken'] = token;
  }

  get srcTokenAddress() {
    return this.data['srcTokenAddress'];
  }

  set srcTokenAddress(token) {
    this.data['srcTokenAddress'] = token;
  }

  get srcAmount() {
    return this.data['srcAmount'];
  }

  set srcAmount(amnt) {
    this.data['srcAmount'] = amnt;
  }

  get dstChainId() {
    return this.data['dstChainId'];
  }

  set dstChainId(id) {
    this.data['dstChainId'] = id;
  }

  get dstTransactionHash() {
    return this.data['dstTransactionHash'];
  }

  set dstTransactionHash(hash) {
    this.data['dstTransactionHash'] = hash;
  }

  get dstToken() {
    return this.data['dstToken'];
  }

  set dstToken(token) {
    this.data['dstToken'] = token;
  }

  get dstTokenAddress() {
    return this.data['dstTokenAddress'];
  }

  set dstTokenAddress(token) {
    this.data['dstTokenAddress'] = token;
  }

  get dstAmount() {
    return this.data['dstAmount'];
  }

  set dstAmount(amnt) {
    this.data['dstAmount'] = amnt;
  }

  get encryptedOnchainNote() {
    return this.data['encryptedOnchainNote'];
  }

  set encryptedOnchainNote(note) {
    this.data['encryptedOnchainNote'] = note;
  }

  get walletId() {
    return this.data['walletId'];
  }

  set walletId(id) {
    this.data['walletId'] = id;
  }

  get shieldedAddress() {
    return this.data['shieldedAddress'];
  }

  set shieldedAddress(address) {
    this.data['shieldedAddress'] = address;
  }

  get status() {
    return this.data['status'];
  }

  set status(s) {
    if (!isValidPrivateNoteStatus(s)) {
      throw 'invalid private note status ' + s;
    }
    this.data['status'] = s;
  }
}

export const PrivateNoteStatus = {
  IMPORTED: 'imported',
  SPENDING: 'spending',
  SPENT: 'spent',
};
Object.freeze(PrivateNoteStatus);
export function isValidPrivateNoteStatus(status) {
  return Object.values(PrivateNoteStatus).includes(status);
}
