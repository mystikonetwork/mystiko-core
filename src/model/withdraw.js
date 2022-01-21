import BN from 'bn.js';
import { check } from '../utils.js';
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
    if (address) {
      check(typeof address === 'string', 'address should be instance of string');
    }
    this.data['tokenAddress'] = address;
  }

  get merkleRootHash() {
    const raw = this.data['merkleRootHash'];
    return raw ? new BN(raw) : undefined;
  }

  set merkleRootHash(hash) {
    check(hash instanceof BN, 'hash should be instance of BN');
    this.data['merkleRootHash'] = hash.toString();
  }

  get serialNumber() {
    const raw = this.data['serialNumber'];
    return raw ? new BN(raw) : undefined;
  }

  set serialNumber(sn) {
    check(sn instanceof BN, 'sn should be instance of BN');
    this.data['serialNumber'] = sn.toString();
  }

  get amount() {
    const raw = this.data['amount'];
    return raw ? new BN(raw) : undefined;
  }

  set amount(amnt) {
    check(amnt instanceof BN, 'amnt should be instance of BN');
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

  get errorMessage() {
    return this.data['errorMessage'];
  }

  set errorMessage(msg) {
    check(typeof msg === 'string', 'msg should be instance of string');
    this.data['errorMessage'] = msg;
  }
}

export const WithdrawStatus = {
  INIT: 'init',
  GENERATING_PROOF: 'generatingProof',
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
};
Object.freeze(WithdrawStatus);
export function isValidWithdrawStatus(status) {
  return Object.values(WithdrawStatus).includes(status);
}
