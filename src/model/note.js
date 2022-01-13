import { BaseModel } from './common.js';
import { check, toBuff, toHexNoPrefix } from '../utils.js';

export class OffchainNote extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  get chainId() {
    return this.data['chainId'];
  }

  set chainId(id) {
    check(typeof id === 'number', 'id should be instance of number');
    this.data['chainId'] = id;
  }

  get transactionHash() {
    return this.data['transactionHash'];
  }

  set transactionHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['transactionHash'] = hash;
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
    check(typeof id === 'number', 'srcChainId should be instance of number');
    this.data['srcChainId'] = id;
  }

  get srcTransactionHash() {
    return this.data['srcTransactionHash'];
  }

  set srcTransactionHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['srcTransactionHash'] = hash;
  }

  get srcToken() {
    return this.data['srcToken'];
  }

  set srcToken(token) {
    check(typeof token === 'string', 'token should be instance of string');
    this.data['srcToken'] = token;
  }

  get srcTokenAddress() {
    return this.data['srcTokenAddress'];
  }

  set srcTokenAddress(address) {
    check(typeof address === 'string', 'address should be instance of string');
    this.data['srcTokenAddress'] = address;
  }

  get srcAmount() {
    const raw = this.data['srcAmount'];
    return raw ? BigInt(raw) : undefined;
  }

  set srcAmount(amnt) {
    check(typeof amnt === 'bigint', 'amnt should be instance of bigint');
    this.data['srcAmount'] = amnt.toString();
  }

  get dstChainId() {
    return this.data['dstChainId'];
  }

  set dstChainId(id) {
    check(typeof id === 'number', 'dstChainId should be instance of number');
    this.data['dstChainId'] = id;
  }

  get dstTransactionHash() {
    return this.data['dstTransactionHash'];
  }

  set dstTransactionHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['dstTransactionHash'] = hash;
  }

  get dstToken() {
    return this.data['dstToken'];
  }

  set dstToken(token) {
    check(typeof token === 'string', 'token should be instance of string');
    this.data['dstToken'] = token;
  }

  get dstTokenAddress() {
    return this.data['dstTokenAddress'];
  }

  set dstTokenAddress(address) {
    check(typeof address === 'string', 'address should be instance of string');
    this.data['dstTokenAddress'] = address;
  }

  get dstAmount() {
    const raw = this.data['dstAmount'];
    return raw ? BigInt(raw) : undefined;
  }

  set dstAmount(amnt) {
    check(typeof amnt === 'bigint', 'amnt should be instance of bigint');
    this.data['dstAmount'] = amnt.toString();
  }

  get encryptedOnchainNote() {
    const raw = this.data['encryptedOnchainNote'];
    return raw ? toBuff(raw) : undefined;
  }

  set encryptedOnchainNote(note) {
    check(note instanceof Buffer, 'note should be instance of Buffer');
    this.data['encryptedOnchainNote'] = toHexNoPrefix(note);
  }

  get walletId() {
    return this.data['walletId'];
  }

  set walletId(id) {
    check(typeof id === 'number', 'dstChainId should be instance of number');
    this.data['walletId'] = id;
  }

  get shieldedAddress() {
    return this.data['shieldedAddress'];
  }

  set shieldedAddress(address) {
    check(typeof address === 'string', 'address should be instance of string');
    this.data['shieldedAddress'] = address;
  }

  get status() {
    return this.data['status'];
  }

  set status(s) {
    check(isValidPrivateNoteStatus(s), 'invalid private note status ' + s);
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
