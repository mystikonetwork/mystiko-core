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

  get asset() {
    return this.data['asset'];
  }

  set asset(a) {
    check(typeof a === 'string', 'a should be instance of string');
    this.data['asset'] = a;
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
    return raw ? new BN(raw) : undefined;
  }

  set commitmentHash(hash) {
    check(hash instanceof BN, 'hash should be instance of Buffer');
    this.data['commitmentHash'] = hash.toString();
  }

  get randomS() {
    const raw = this.data['randomS'];
    return raw ? new BN(raw) : undefined;
  }

  set randomS(s) {
    check(s instanceof BN, 's should be instance of Buffer');
    this.data['randomS'] = s.toString();
  }

  get hashK() {
    const raw = this.data['hashK'];
    return raw ? new BN(raw) : undefined;
  }

  set hashK(k) {
    check(k instanceof BN, 'k should be instance of Buffer');
    this.data['hashK'] = k.toString();
  }

  get privateNote() {
    const raw = this.data['privateNote'];
    return raw ? toBuff(raw) : undefined;
  }

  set privateNote(note) {
    check(note instanceof Buffer, 'note should be instance of Buffer');
    this.data['privateNote'] = toHexNoPrefix(note);
  }

  get assetApproveTxHash() {
    return this.data['assetApproveTxHash'];
  }

  set assetApproveTxHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['assetApproveTxHash'] = hash;
  }

  get srcTxHash() {
    return this.data['srcTxHash'];
  }

  set srcTxHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['srcTxHash'] = hash;
  }

  get bridgeTxHash() {
    return this.data['bridgeTxHash'];
  }

  set bridgeTxHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['bridgeTxHash'] = hash;
  }

  get dstTxHash() {
    return this.data['dstTxHash'];
  }

  set dstTxHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['dstTxHash'] = hash;
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

  get errorMessage() {
    return this.data['errorMessage'];
  }

  set errorMessage(msg) {
    check(typeof msg === 'string', 'msg should be instance of string');
    this.data['errorMessage'] = msg;
  }
}
export const DepositStatus = {
  INIT: 'init',
  ASSET_APPROVING: 'assetApproving',
  ASSET_APPROVED: 'assetApproved',
  SRC_PENDING: 'srcPending',
  SRC_CONFIRMED: 'srcSucceeded',
  BRIDGE_PENDING: 'bridgePending',
  BRIDGE_CONFIRMED: 'bridgeSucceeded',
  DST_PENDING: 'dstPending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
};
Object.freeze(DepositStatus);
export function isValidDepositStatus(status) {
  return Object.values(DepositStatus).includes(status);
}
