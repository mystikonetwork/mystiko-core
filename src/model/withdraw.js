import BN from 'bn.js';
import { check } from '../utils.js';
import { BaseModel } from './common.js';
import { MystikoConfig } from '../config';

/**
 * @class Withdraw
 * @extends BaseModel
 * @param {Object} [data={}] raw data of the Account model.
 * @desc data model for storing withdrawal transaction data.
 */
export class Withdraw extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  /**
   * @property {number} chainId
   * @desc the destination chain id where this withdrawal transaction was created.
   */
  get chainId() {
    return this.data['chainId'];
  }

  set chainId(id) {
    check(typeof id === 'number', 'id should be instance of number');
    this.data['chainId'] = id;
  }

  /**
   * @property {string} asset
   * @desc the asset symbol of this withdrawal transaction.
   */
  get asset() {
    return this.data['asset'];
  }

  set asset(t) {
    check(typeof t === 'string', 'token should be instance of string');
    this.data['asset'] = t;
  }

  /**
   * @property {string} assetAddress
   * @desc the asset address of this withdrawal transaction.
   */
  get assetAddress() {
    return this.data['assetAddress'];
  }

  set assetAddress(address) {
    if (address) {
      check(typeof address === 'string', 'address should be instance of string');
    }
    this.data['assetAddress'] = address;
  }

  /**
   * @property {external:BN} merkleRootHash
   * @desc the calculated merkle root hash when this withdrawal transaction was created.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  get merkleRootHash() {
    const raw = this.data['merkleRootHash'];
    return raw ? new BN(raw) : undefined;
  }

  set merkleRootHash(hash) {
    check(hash instanceof BN, 'hash should be instance of BN');
    this.data['merkleRootHash'] = hash.toString();
  }

  /**
   * @property {external:BN} serialNumber
   * @desc the calculated serial number for the deposit which this withdrawal transaction being spending.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  get serialNumber() {
    const raw = this.data['serialNumber'];
    return raw ? new BN(raw) : undefined;
  }

  set serialNumber(sn) {
    check(sn instanceof BN, 'sn should be instance of BN');
    this.data['serialNumber'] = sn.toString();
  }

  /**
   * @property {external:BN} amount
   * @desc the amount of asset for this withdrawal transaction.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  get amount() {
    const raw = this.data['amount'];
    return raw ? new BN(raw) : undefined;
  }

  set amount(amnt) {
    check(amnt instanceof BN, 'amnt should be instance of BN');
    this.data['amount'] = amnt.toString();
  }

  /**
   * @property {string} recipientAddress
   * @desc the recipient address of this withdrawal transaction.
   */
  get recipientAddress() {
    return this.data['recipientAddress'];
  }

  set recipientAddress(address) {
    check(typeof address === 'string', 'address should be instance of string');
    this.data['recipientAddress'] = address;
  }

  /**
   * @property {string} transactionHash
   * @desc the transaction hash of this withdrawal transaction after it is submitted.
   */
  get transactionHash() {
    return this.data['transactionHash'];
  }

  set transactionHash(hash) {
    check(typeof hash === 'string', 'address should be instance of string');
    this.data['transactionHash'] = hash;
  }

  /**
   * @desc get the full explorer URL of withdrawal transaction.
   * @param {MystikoConfig} config current effective config.
   * @returns {string|undefined} a full explorer URL of this withdrawal transaction.
   */
  getTxExplorerUrl(config) {
    check(config instanceof MystikoConfig, 'config should be an instance of MystikoConfig');
    return config.getChainTxExplorerUrl(this.chainId, this.transactionHash);
  }

  /**
   * @property {number} walletId
   * @desc the associated {@link Wallet#id} of this withdrawal transaction.
   */
  get walletId() {
    return this.data['walletId'];
  }

  set walletId(id) {
    check(typeof id === 'number', 'id should be instance of number');
    this.data['walletId'] = id;
  }

  /**
   * @property {string} shieldedAddress
   * @desc the shielded address of this withdrawal transaction when it uses to calculate proofs.
   */
  get shieldedAddress() {
    return this.data['shieldedAddress'];
  }

  set shieldedAddress(address) {
    check(typeof address === 'string', 'address should be instance of string');
    this.data['shieldedAddress'] = address;
  }

  /**
   * @property {number} privateNoteId
   * @desc the associated {@link PrivateNote#id} of this withdrawal transaction.
   */
  get privateNoteId() {
    return this.data['privateNoteId'];
  }

  set privateNoteId(id) {
    check(typeof id === 'number', 'id should be instance of number');
    this.data['privateNoteId'] = id;
  }

  /**
   * @property {module:mystiko/models.WithdrawStatus} status
   * @desc status of this withdrawal transaction.
   */
  get status() {
    return this.data['status'];
  }

  set status(s) {
    check(isValidWithdrawStatus(s), 'invalid deposit status ' + s);
    this.data['status'] = s;
  }

  /**
   * @property {string|undefined} errorMessage
   * @desc error message during the execution of this withdrawal transaction.
   * If the status is SUCCEEDED, this field is undefined.
   */
  get errorMessage() {
    return this.data['errorMessage'];
  }

  set errorMessage(msg) {
    check(typeof msg === 'string', 'msg should be instance of string');
    this.data['errorMessage'] = msg;
  }
}

/**
 * @typedef WithdrawStatus
 * @name module:mystiko/models.WithdrawStatus
 * @desc status enums of the withdrawal transactions.
 * @property {string} INIT this status will be set immediately after the Withdraw object
 * is created and saved to database.
 * @property {string} GENERATING_PROOF this status will be set when zkSnark proofs are being generated.
 * @property {string} PENDING this status will be set after the withdrawal transaction is successfully
 * submitted to the destination blockchain.
 * @property {string} SUCCEEDED this status will be set after the withdrawal transaction
 * is successfully confirmed on the destination blockchain.
 * @property {string} FAILED this status will be set after seeing any errors raised during the whole
 * lifecycle of this withdrawal transaction.
 */
export const WithdrawStatus = {
  INIT: 'init',
  GENERATING_PROOF: 'generatingProof',
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
};
Object.freeze(WithdrawStatus);

/**
 * @function module:mystiko/models.isValidWithdrawStatus
 * @desc check whether given status string is a valid {@link module:mystiko/models.WithdrawStatus}.
 * @param {string} status
 * @returns {boolean} true if {@link module:mystiko/models.WithdrawStatus} contains it, otherwise it returns false.
 */
export function isValidWithdrawStatus(status) {
  return Object.values(WithdrawStatus).includes(status);
}
