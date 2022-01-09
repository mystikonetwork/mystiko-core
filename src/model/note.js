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

export class OnchainNote extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  get amount() {
    return this.data['amount'];
  }

  set amount(amnt) {
    this.data['amount'] = amnt;
  }

  get randomSecretP() {
    return this.data['randomSecretP'];
  }

  set randomSecretP(secret) {
    this.data['randomSecretP'] = secret;
  }

  get randomSecretR() {
    return this.data['randomSecretR'];
  }

  set randomSecretR(secret) {
    this.data['randomSecretR'] = secret;
  }

  get randomSecretS() {
    return this.data['randomSecretS'];
  }

  set randomSecretS(secret) {
    this.data['randomSecretS'] = secret;
  }

  get checkSum() {
    return this.data['checkSum'];
  }

  set checkSum(md5) {
    this.data['checkSum'] = md5;
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
}
