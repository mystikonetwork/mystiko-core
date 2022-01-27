import BN from 'bn.js';
import { BaseModel } from './common.js';
import { check, toBuff, toHexNoPrefix } from '../utils.js';
import { isValidBridgeType } from './common.js';
import { MystikoConfig } from '../config';

/**
 * @class OffChainNote
 * @extends BaseModel
 * @param {Object} [data={}] raw data of the Account model.
 * @desc data model for storing off-chain private note data.
 */
export class OffChainNote extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  /**
   * @property {number} chainId
   * @desc the chain id where this off-chain note is created from.
   */
  get chainId() {
    return this.data['chainId'];
  }

  set chainId(id) {
    check(typeof id === 'number', 'id should be instance of number');
    this.data['chainId'] = id;
  }

  /**
   * @property {string} transactionHash
   * @desc the transaction hash where this off-chain note is created from.
   */
  get transactionHash() {
    return this.data['transactionHash'];
  }

  set transactionHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['transactionHash'] = hash;
  }
}

/**
 * @class PrivateNote
 * @extends BaseModel
 * @param {Object} [data={}] raw data of the Account model.
 * @desc data model for storing combined on-chain private note data and deposit transaction data.
 */
export class PrivateNote extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  /**
   * @property {number} srcChainId
   * @desc the source chain id where the underlying deposit was created.
   */
  get srcChainId() {
    return this.data['srcChainId'];
  }

  set srcChainId(id) {
    check(typeof id === 'number', 'srcChainId should be instance of number');
    this.data['srcChainId'] = id;
  }

  /**
   * @property {string} srcTransactionHash
   * @desc the transaction hash of the underlying deposit on the source chain.
   */
  get srcTransactionHash() {
    return this.data['srcTransactionHash'];
  }

  set srcTransactionHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['srcTransactionHash'] = hash;
  }

  /**
   * @desc get the explorer URL for transaction in source chain.
   * @param {MystikoConfig} config current effective config.
   * @returns {string} a full URL of source chain transaction. It returns undefined if source chain config
   * is not provided or the transaction hash of source chain is not set.
   */
  getSrcTxExplorerUrl(config) {
    check(config instanceof MystikoConfig, 'config should be an instance of MystikoConfig');
    return config.getChainTxExplorerUrl(this.srcChainId, this.srcTransactionHash);
  }

  /**
   * @property {string} srcAsset
   * @desc the asset symbol of the underlying deposit on the source chain.
   */
  get srcAsset() {
    return this.data['srcAsset'];
  }

  set srcAsset(token) {
    check(typeof token === 'string', 'token should be instance of string');
    this.data['srcAsset'] = token;
  }

  /**
   * @property {string} srcAssetAddress
   * @desc the asset contract address of the underlying deposit on the source chain.
   */
  get srcAssetAddress() {
    return this.data['srcAssetAddress'];
  }

  set srcAssetAddress(address) {
    if (address) {
      check(typeof address === 'string', 'address should be instance of string');
    }
    this.data['srcAssetAddress'] = address;
  }

  /**
   * @property {string} srcProtocolAddress
   * @desc the Mystiko protocol contract address on the source chain of the underlying deposit was sent to.
   */
  get srcProtocolAddress() {
    return this.data['srcProtocolAddress'];
  }

  set srcProtocolAddress(address) {
    check(typeof address === 'string', 'address should be instance of string');
    this.data['srcProtocolAddress'] = address;
  }

  /**
   * @property {external:BN} amount
   * @desc the amount of asset the underlying deposit.
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
   * @property {module:mystiko/models.BridgeType} bridge
   * @desc the type of cross-chain for the underlying deposit.
   */
  get bridge() {
    return this.data['bridge'];
  }

  set bridge(b) {
    check(isValidBridgeType(b), 'b is an invalid BridgeType');
    this.data['bridge'] = b;
  }

  /**
   * @property {number} dstChainId
   * @desc the destination chain id where the underlying deposit was created.
   * If the {@link PrivateNote#bridge} is loop, this field equals
   * {@link PrivateNote#srcChainId}.
   */
  get dstChainId() {
    return this.data['dstChainId'];
  }

  set dstChainId(id) {
    check(typeof id === 'number', 'dstChainId should be instance of number');
    this.data['dstChainId'] = id;
  }

  /**
   * @property {string} dstTransactionHash
   * @desc the transaction hash of the underlying deposit on the destination chain.
   * If the {@link PrivateNote#bridge} is loop, this field equals
   * {@link PrivateNote#srcTransactionHash}.
   */
  get dstTransactionHash() {
    return this.data['dstTransactionHash'];
  }

  set dstTransactionHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['dstTransactionHash'] = hash;
  }

  /**
   * @desc get the explorer URL for transaction in destination chain.
   * @param {MystikoConfig} config current effective config.
   * @returns {string} a full URL of destination chain transaction. It returns undefined if destination chain config
   * is not provided or the transaction hash of destination chain is not set.
   */
  getDstTxExplorerUrl(config) {
    check(config instanceof MystikoConfig, 'config should be an instance of MystikoConfig');
    return config.getChainTxExplorerUrl(this.dstChainId, this.dstTransactionHash);
  }

  /**
   * @property {string} dstAsset
   * @desc the asset symbol of the underlying deposit on the destination chain.
   * If the {@link PrivateNote#bridge} is loop, this field equals
   * {@link PrivateNote#srcAsset}.
   */
  get dstAsset() {
    return this.data['dstAsset'];
  }

  set dstAsset(token) {
    check(typeof token === 'string', 'token should be instance of string');
    this.data['dstAsset'] = token;
  }

  /**
   * @property {string} dstAssetAddress
   * @desc the asset contract address of the underlying deposit on the destination chain.
   * If the {@link PrivateNote#bridge} is loop, this field equals
   * {@link PrivateNote#srcAssetAddress}.
   */
  get dstAssetAddress() {
    return this.data['dstAssetAddress'];
  }

  set dstAssetAddress(address) {
    if (address) {
      check(typeof address === 'string', 'address should be instance of string');
    }
    this.data['dstAssetAddress'] = address;
  }

  /**
   * @property {string} dstProtocolAddress
   * @desc the Mystiko protocol contract address on the destination chain of the underlying deposit was sent to.
   * If the {@link PrivateNote#bridge} is loop, this field equals
   * {@link PrivateNote#srcProtocolAddress}.
   */
  get dstProtocolAddress() {
    return this.data['dstProtocolAddress'];
  }

  set dstProtocolAddress(address) {
    check(typeof address === 'string', 'address should be instance of string');
    this.data['dstProtocolAddress'] = address;
  }

  /**
   * @property {external:BN} commitmentHash
   * @desc hash of the commitment of the underlying deposit.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  get commitmentHash() {
    const raw = this.data['commitmentHash'];
    return raw ? new BN(raw) : undefined;
  }

  set commitmentHash(hash) {
    check(hash instanceof BN, 'hash should be instance of BN');
    this.data['commitmentHash'] = hash.toString();
  }

  /**
   * @property {Buffer} encryptedOnChainNote
   * @desc encrypted on chain private note data of the underlying deposit.
   * Use {@link module:mystiko/utils.toHex} to convert it to hex string.
   */
  get encryptedOnChainNote() {
    const raw = this.data['encryptedOnChainNote'];
    return raw ? toBuff(raw) : undefined;
  }

  set encryptedOnChainNote(note) {
    check(note instanceof Buffer, 'note should be instance of Buffer');
    this.data['encryptedOnChainNote'] = toHexNoPrefix(note);
  }

  /**
   * @property {number} walletId
   * @desc the associated {@link Wallet#id} of the underlying deposit.
   */
  get walletId() {
    return this.data['walletId'];
  }

  set walletId(id) {
    check(typeof id === 'number', 'dstChainId should be instance of number');
    this.data['walletId'] = id;
  }

  /**
   * @property {string} shieldedAddress
   * @desc the shielded address of which the underlying deposit was sent to.
   */
  get shieldedAddress() {
    return this.data['shieldedAddress'];
  }

  set shieldedAddress(address) {
    check(typeof address === 'string', 'address should be instance of string');
    this.data['shieldedAddress'] = address;
  }

  /**
   * @property {string} withdrawTransactionHash
   * @desc the withdrawal transaction hash after this private note be spent.
   */
  get withdrawTransactionHash() {
    return this.data['withdrawTransactionHash'];
  }

  set withdrawTransactionHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['withdrawTransactionHash'] = hash;
  }

  /**
   * @property {module:mystiko/models.PrivateNoteStatus} status
   * @desc status of this private note.
   */
  get status() {
    return this.data['status'];
  }

  set status(s) {
    check(isValidPrivateNoteStatus(s), 'invalid private note status ' + s);
    this.data['status'] = s;
  }
}

/**
 * @typedef PrivateNoteStatus
 * @name module:mystiko/models.PrivateNoteStatus
 * @desc status enum of private notes.
 * @property {string} IMPORTED status indicates the private note is successfully imported.
 * @property {string} SPENT status indicates the private note is sucessfully spent.
 */
export const PrivateNoteStatus = {
  IMPORTED: 'imported',
  SPENT: 'spent',
};
Object.freeze(PrivateNoteStatus);

/**
 * @function module:mystiko/models.isValidPrivateNoteStatus
 * @desc check whether given status is a valid PrivateNote status.
 * @param {string} status
 * @returns {boolean} true if {@link module:mystiko/models.PrivateNoteStatus} contains it, otherwise it returns false.
 */
export function isValidPrivateNoteStatus(status) {
  return Object.values(PrivateNoteStatus).includes(status);
}
