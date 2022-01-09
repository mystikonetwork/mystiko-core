import { BaseModel } from './common.js';

export class Withdraw extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  get chainId() {
    return this.data['chainId'];
  }

  set chainId(id) {
    this.data['chainId'] = id;
  }

  get token() {
    return this.data['token'];
  }

  set token(t) {
    this.data['token'] = t;
  }

  get proof() {
    return this.data['proof'];
  }

  set proof(p) {
    this.data['proof'] = p;
  }

  get merkleRootHash() {
    return this.data['merkleRootHash'];
  }

  set merkleRootHash(hash) {
    this.data['merkleRootHash'] = hash;
  }

  get serialNumber() {
    return this.data['serialNumber'];
  }

  set serialNumber(sn) {
    this.data['serialNumber'] = sn;
  }

  get amount() {
    return this.data['amount'];
  }

  set amount(amnt) {
    this.data['amount'] = amnt;
  }

  get recipientAddress() {
    return this.data['recipientAddress'];
  }

  set recipientAddress(address) {
    this.data['recipientAddress'] = address;
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

  get status() {
    return this.data['status'];
  }

  set status(s) {
    if (isValidWithdrawStatus(s)) {
      this.data['status'] = s;
    } else {
      throw 'invalid deposit status ' + s;
    }
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
