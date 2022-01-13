import { check, toBuff, toHexNoPrefix } from '../utils.js';
import { BaseModel } from './common.js';

export class Withdraw extends BaseModel {
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

  get token() {
    return this.data['token'];
  }

  set token(t) {
    check(typeof t === 'string', 'token should be instance of string');
    this.data['token'] = t;
  }

  get tokenAddress() {
    return this.data['tokenAddress'];
  }

  set tokenAddress(address) {
    check(typeof address === 'string', 'address should be instance of string');
    this.data['tokenAddress'] = address;
  }

  get merkleRootHash() {
    const raw = this.data['merkleRootHash'];
    return raw ? BigInt(raw) : undefined;
  }

  set merkleRootHash(hash) {
    check(typeof hash === 'bigint', 'hash should be instance of bigint');
    this.data['merkleRootHash'] = hash.toString();
  }

  get serialNumber() {
    const raw = this.data['serialNumber'];
    return raw ? toBuff(raw) : undefined;
  }

  set serialNumber(sn) {
    check(sn instanceof Buffer, 'sn should be instance of Buffer');
    this.data['serialNumber'] = toHexNoPrefix(sn);
  }

  get amount() {
    const raw = this.data['amount'];
    return raw ? BigInt(raw) : undefined;
  }

  set amount(amnt) {
    check(typeof amnt === 'bigint', 'amnt should be instance of bigint');
    this.data['amount'] = amnt.toString();
  }

  get recipientAddress() {
    return this.data['recipientAddress'];
  }

  set recipientAddress(address) {
    check(typeof address === 'string', 'address should be instance of string');
    this.data['recipientAddress'] = address;
  }

  get transactionHash() {
    return this.data['transactionHash'];
  }

  set transactionHash(hash) {
    check(typeof hash === 'string', 'address should be instance of string');
    this.data['transactionHash'] = hash;
  }

  get walletId() {
    return this.data['walletId'];
  }

  set walletId(id) {
    check(typeof id === 'number', 'id should be instance of number');
    this.data['walletId'] = id;
  }

  get shieldedAddress() {
    return this.data['shieldedAddress'];
  }

  set shieldedAddress(address) {
    check(typeof address === 'string', 'address should be instance of string');
    this.data['shieldedAddress'] = address;
  }

  get privateNoteId() {
    return this.data['privateNoteId'];
  }

  set privateNoteId(id) {
    check(typeof id === 'number', 'id should be instance of number');
    this.data['privateNoteId'] = id;
  }

  get status() {
    return this.data['status'];
  }

  set status(s) {
    check(isValidWithdrawStatus(s), 'invalid deposit status ' + s);
    this.data['status'] = s;
  }
}

export const WithdrawStatus = {
  INIT: 'init',
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
};
Object.freeze(WithdrawStatus);
export function isValidWithdrawStatus(status) {
  return Object.values(WithdrawStatus).includes(status);
}
