import { BaseModel } from './common.js';

export class Deposit extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  get srcChainId() {
    return this.data['srcChainId'];
  }

  set srcChainId(id) {
    this.data['srcChainId'] = id;
  }

  get dstChainId() {
    return this.data['dstChainId'];
  }

  set dstChainId(id) {
    this.data['dstChainId'] = id;
  }

  get bridge() {
    return this.data['bridge'];
  }

  set bridge(b) {
    this.data['bridge'] = b;
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

  get commitmentHash() {
    return this.data['commitmentHash'];
  }

  set commitmentHash(hash) {
    this.data['commitmentHash'] = hash;
  }

  get encryptedNote() {
    return this.data['encryptedNote'];
  }

  set encryptedNote(note) {
    this.data['encryptedNote'] = note;
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

  get srcAddress() {
    return this.data['srcAddress'];
  }

  set srcAddress(address) {
    this.data['srcAddress'] = address;
  }

  get shieldedRecipientAddress() {
    return this.data['shieldedRecipientAddress'];
  }

  set shieldedRecipientAddress(address) {
    this.data['shieldedRecipientAddress'] = address;
  }

  get status() {
    return this.data['status'];
  }

  set status(s) {
    if (isValidDepositStatus(s)) {
      this.data['status'] = s;
    } else {
      throw 'invalid deposit status ' + s;
    }
  }
}
export const DepositStatus = {
  INIT: 'init',
  SRC_PENDING: 'srcPending',
  SRC_SUCCEEDED: 'srcSucceeded',
  SRC_FAILED: 'srcFailed',
  BRIDGE_PENDING: 'bridgePending',
  BRIDGE_SUCCEEDED: 'bridgeSucceeded',
  BRIDGE_FAILED: 'bridgeFailed',
  DST_PENDING: 'dstPending',
  DST_SUCCEEDED: 'dstSucceeded',
  DST_FAILED: 'dstFailed',
};
Object.freeze(DepositStatus);
export function isValidDepositStatus(status) {
  return Object.values(DepositStatus).includes(status);
}
