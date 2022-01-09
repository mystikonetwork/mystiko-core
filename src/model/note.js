import { PrivateKey, PublicKey, encrypt, decrypt } from 'eciesjs';
import md5 from 'crypto-js/md5';
import { BaseModel } from './common.js';

export const NoteType = {
  OnchainNote: 'onchain',
  OffchainNote: 'offchain',
};
Object.freeze(NoteType);
export function isValidNoteType(type) {
  return Object.values(NoteType).includes(type);
}

export class EncryptedNote extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  get type() {
    return this.data['type'];
  }

  set type(t) {
    if (isValidNoteType(t)) {
      this.data['type'] = t;
    } else {
      throw 'unknown note type ' + t;
    }
  }

  get encryptedNote() {
    return this.data['encryptedNote'];
  }

  set encryptedNote(n) {
    this.data['encryptedNote'] = n;
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
}

export const AMOUNT_LEN = 32;
export const RANDOM_SECRET_P_LEN = 16;
export const RANDOM_SECRET_R_LEN = 16;
export const RANDOM_SECRET_S_LEN = 16;
export const CHECKSUM_LEN = 16;
export const ONCHAIN_NOTE_LEN = AMOUNT_LEN + RANDOM_SECRET_P_LEN + RANDOM_SECRET_R_LEN + RANDOM_SECRET_S_LEN;
export class OnchainNote extends BaseModel {
  constructor(data = {}) {
    super(data);
    OnchainNote.checkAmount(this.amount);
    OnchainNote.checkRandomSecretP(this.randomSecretP);
    OnchainNote.checkRandomSecretR(this.randomSecretR);
    OnchainNote.checkRandomSecretS(this.randomSecretS);
  }

  get amount() {
    return this.data['amount'];
  }

  set amount(amnt) {
    OnchainNote.checkAmount(amnt);
    this.data['amount'] = amnt;
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
    return Buffer.concat([
      Buffer.from(this.amount, 'hex'),
      Buffer.from(this.randomSecretP, 'hex'),
      Buffer.from(this.randomSecretR, 'hex'),
      Buffer.from(this.randomSecretS, 'hex'),
    ]);
  }

  get checkSum() {
    return md5(this.bytes.toString('hex')).toString();
  }

  getEncrypted(publicKeyHex) {
    const fullBytes = Buffer.concat([
      Buffer.from(this.amount, 'hex'),
      Buffer.from(this.randomSecretP, 'hex'),
      Buffer.from(this.randomSecretR, 'hex'),
      Buffer.from(this.randomSecretS, 'hex'),
      Buffer.from(this.checkSum, 'hex'),
    ]);
    const publicKey = PublicKey.fromHex(publicKeyHex);
    return encrypt(publicKey, fullBytes).toString('hex');
  }

  static checkAmount(amount) {
    if (!amount || amount.length !== AMOUNT_LEN * 2) {
      throw 'invalid amount hex string';
    }
  }

  static checkRandomSecretP(p) {
    if (!p || p.length !== RANDOM_SECRET_P_LEN * 2) {
      throw 'invalid random secret p hex string';
    }
  }

  static checkRandomSecretR(r) {
    if (!r || r.length !== RANDOM_SECRET_R_LEN * 2) {
      throw 'invalid random secret r hex string';
    }
  }

  static checkRandomSecretS(s) {
    if (!s || s.length !== RANDOM_SECRET_S_LEN * 2) {
      throw 'invalid random secret s hex string';
    }
  }

  static decryptNote(secretKeyHex, encryptedNote) {
    const secretKey = PrivateKey.fromHex(secretKeyHex);
    const decrypted = decrypt(secretKey, Buffer.from(encryptedNote, 'hex'));
    if (decrypted.length != ONCHAIN_NOTE_LEN + CHECKSUM_LEN) {
      throw 'invalid encryptedNote, decrypted length does not match';
    }
    const onchainNote = new OnchainNote({
      amount: decrypted.slice(0, AMOUNT_LEN).toString('hex'),
      randomSecretP: decrypted.slice(AMOUNT_LEN, AMOUNT_LEN + RANDOM_SECRET_P_LEN).toString('hex'),
      randomSecretR: decrypted
        .slice(AMOUNT_LEN + RANDOM_SECRET_P_LEN, AMOUNT_LEN + RANDOM_SECRET_P_LEN + RANDOM_SECRET_R_LEN)
        .toString('hex'),
      randomSecretS: decrypted
        .slice(AMOUNT_LEN + RANDOM_SECRET_P_LEN + RANDOM_SECRET_R_LEN, ONCHAIN_NOTE_LEN)
        .toString('hex'),
    });
    const checkSum = decrypted.slice(ONCHAIN_NOTE_LEN, ONCHAIN_NOTE_LEN + CHECKSUM_LEN).toString('hex');
    if (onchainNote.checkSum !== checkSum) {
      throw 'invalid on chain note, checkSum does not match';
    }
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

  get token() {
    return this.data['token'];
  }

  set token(t) {
    this.data['token'] = t;
  }

  get amount() {
    return this.data['amount'];
  }

  set amount(amnt) {
    this.data['amount'] = amnt;
  }

  get bytes() {
    return Buffer.from(JSON.stringify(this.data));
  }

  get checkSum() {
    return md5(JSON.stringify(this.data)).toString();
  }

  getEncryptedNote(publicKeyHex) {
    const publicKey = PublicKey.fromHex(publicKeyHex);
    const fullBytes = Buffer.concat([Buffer.from(this.checkSum, 'hex'), this.bytes]);
    return encrypt(publicKey, fullBytes).toString('hex');
  }

  static decryptNote(secretKeyHex, encryptedNote) {
    const secretKey = PrivateKey.fromHex(secretKeyHex);
    const decrypted = decrypt(secretKey, Buffer.from(encryptedNote, 'hex'));
    if (decrypted.length <= CHECKSUM_LEN) {
      throw 'invalid off chain encryptedNote length';
    }
    const checkSum = decrypted.slice(0, CHECKSUM_LEN).toString('hex');
    const data = JSON.parse(Buffer.slice(CHECKSUM_LEN).toString());
    const offchainNote = new OffchainNote(data);
    if (offchainNote.checkSum !== checkSum) {
      throw 'invalid off chain note, checkSum does not match';
    }
    return offchainNote;
  }
}
