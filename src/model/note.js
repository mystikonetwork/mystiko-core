import BN from 'bn.js';
import { BaseModel } from './common.js';
import { check, toBuff, toHexNoPrefix } from '../utils.js';
import { isValidBridgeType } from '../config/contractConfig.js';

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

  get srcProtocolAddress() {
    return this.data['srcProtocolAddress'];
  }

  set srcProtocolAddress(address) {
    check(typeof address === 'string', 'address should be instance of string');
    this.data['srcProtocolAddress'] = address;
  }

  get amount() {
    const raw = this.data['amount'];
    return raw ? new BN(raw) : undefined;
  }

  get bridge() {
    return this.data['bridge'];
  }

  set bridge(b) {
    check(isValidBridgeType(b), 'b is an invalid BridgeType');
    this.data['bridge'] = b;
  }

  set amount(amnt) {
    check(amnt instanceof BN, 'amnt should be instance of BN');
    this.data['amount'] = amnt.toString();
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

  get dstProtocolAddress() {
    return this.data['dstProtocolAddress'];
  }

  set dstProtocolAddress(address) {
    check(typeof address === 'string', 'address should be instance of string');
    this.data['dstProtocolAddress'] = address;
  }

  get commitmentHash() {
    const raw = this.data['commitmentHash'];
    return raw ? new BN(raw) : undefined;
  }

  set commitmentHash(hash) {
    check(hash instanceof BN, 'hash should be instance of BN');
    this.data['commitmentHash'] = hash.toString();
  }

  get encryptedOnChainNote() {
    const raw = this.data['encryptedOnChainNote'];
    return raw ? toBuff(raw) : undefined;
  }

  set encryptedOnChainNote(note) {
    check(note instanceof Buffer, 'note should be instance of Buffer');
    this.data['encryptedOnChainNote'] = toHexNoPrefix(note);
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

  get withdrawTransactionHash() {
    return this.data['withdrawTransactionHash'];
  }

  set withdrawTransactionHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['withdrawTransactionHash'] = hash;
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
  SPENT: 'spent',
};
Object.freeze(PrivateNoteStatus);
export function isValidPrivateNoteStatus(status) {
  return Object.values(PrivateNoteStatus).includes(status);
}
