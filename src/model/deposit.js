import BN from 'bn.js';
import { BaseModel } from './common.js';
import { check, toBuff, toHexNoPrefix } from '../utils.js';

export class Deposit extends BaseModel {
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

  get dstChainId() {
    return this.data['dstChainId'];
  }

  set dstChainId(id) {
    check(typeof id === 'number', 'dstChainId should be instance of number');
    this.data['dstChainId'] = id;
  }

  get bridge() {
    return this.data['bridge'];
  }

  set bridge(b) {
    check(typeof b === 'string', 'b should be instance of string');
    this.data['bridge'] = b;
  }

  get token() {
    return this.data['token'];
  }

  set token(t) {
    check(typeof t === 'string', 't should be instance of string');
    this.data['token'] = t;
  }

  get tokenAddress() {
    return this.data['tokenAddress'];
  }

  set tokenAddress(address) {
    check(typeof address === 'string', 'address should be instance of string');
    this.data['tokenAddress'] = address;
  }

  get amount() {
    const raw = this.data['amount'];
    return raw ? new BN(raw) : undefined;
  }

  set amount(amnt) {
    check(amnt instanceof BN, 'amnt should be instance of BN');
    this.data['amount'] = amnt.toString();
  }

  get commitmentHash() {
    const raw = this.data['commitmentHash'];
    return raw ? toBuff(raw) : undefined;
  }

  set commitmentHash(hash) {
    check(hash instanceof Buffer, 'hash should be instance of Buffer');
    this.data['commitmentHash'] = toHexNoPrefix(hash);
  }

  get encryptedNote() {
    const raw = this.data['encryptedNote'];
    return raw ? toBuff(raw) : undefined;
  }

  set encryptedNote(note) {
    check(note instanceof Buffer, 'note should be instance of Buffer');
    this.data['encryptedNote'] = toHexNoPrefix(note);
  }

  get transactionHash() {
    return this.data['transactionHash'];
  }

  set transactionHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['transactionHash'] = hash;
  }

  get walletId() {
    return this.data['walletId'];
  }

  set walletId(id) {
    check(typeof id === 'number', 'id should be instance of string');
    this.data['walletId'] = id;
  }

  get srcAddress() {
    return this.data['srcAddress'];
  }

  set srcAddress(address) {
    check(typeof address === 'string', 'srcAddress should be instance of string');
    this.data['srcAddress'] = address;
  }

  get shieldedRecipientAddress() {
    return this.data['shieldedRecipientAddress'];
  }

  set shieldedRecipientAddress(address) {
    check(typeof address === 'string', 'shieldedRecipientAddress should be instance of string');
    this.data['shieldedRecipientAddress'] = address;
  }

  get status() {
    return this.data['status'];
  }

  set status(s) {
    check(isValidDepositStatus(s), 'invalid deposit status ' + s);
    this.data['status'] = s;
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
