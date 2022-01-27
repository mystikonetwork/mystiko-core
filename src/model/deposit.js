import BN from 'bn.js';
import { BaseModel } from './common.js';
import { check, toBuff, toHexNoPrefix } from '../utils.js';
import { MystikoConfig } from '../config';

/**
 * @class Deposit
 * @extends BaseModel
 * @param {Object} [data={}] raw data of the Account model.
 * @desc data model for storing deposit transaction data.
 */
export class Deposit extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  /**
   * @property {number} srcChainId
   * @desc the source chain id where this deposit was created.
   */
  get srcChainId() {
    return this.data['srcChainId'];
  }

  set srcChainId(id) {
    check(typeof id === 'number', 'srcChainId should be instance of number');
    this.data['srcChainId'] = id;
  }

  /**
   * @property {number} dstChainId
   * @desc the destination chain id where this deposit was created.
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
   * @property {module:mystiko/models.BridgeType} bridge
   * @desc the type of cross-chain for this deposit.
   */
  get bridge() {
    return this.data['bridge'];
  }

  set bridge(b) {
    check(typeof b === 'string', 'b should be instance of string');
    this.data['bridge'] = b;
  }

  /**
   * @property {string} asset
   * @desc the asset symbol of this deposit on the source chain.
   */
  get asset() {
    return this.data['asset'];
  }

  set asset(a) {
    check(typeof a === 'string', 'a should be instance of string');
    this.data['asset'] = a;
  }

  /**
   * @property {external:BN} amount
   * @desc the amount of asset this deposit.
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
   * @property {external:BN} commitmentHash
   * @desc hash of the commitment of this deposit.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  get commitmentHash() {
    const raw = this.data['commitmentHash'];
    return raw ? new BN(raw) : undefined;
  }

  set commitmentHash(hash) {
    check(hash instanceof BN, 'hash should be instance of Buffer');
    this.data['commitmentHash'] = hash.toString();
  }

  /**
   * @property {external:BN} randomS
   * @desc the random S parameter of this deposit for generating commitment.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  get randomS() {
    const raw = this.data['randomS'];
    return raw ? new BN(raw) : undefined;
  }

  set randomS(s) {
    check(s instanceof BN, 's should be instance of Buffer');
    this.data['randomS'] = s.toString();
  }

  /**
   * @property {external:BN} hashK
   * @desc the intermediate hash K of this deposit for generating commitment.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  get hashK() {
    const raw = this.data['hashK'];
    return raw ? new BN(raw) : undefined;
  }

  set hashK(k) {
    check(k instanceof BN, 'k should be instance of Buffer');
    this.data['hashK'] = k.toString();
  }

  /**
   * @property {Buffer} privateNote
   * @desc encrypted on chain private note data of this deposit.
   * Use {@link module:mystiko/utils.toHex} to convert it to hex string.
   */
  get privateNote() {
    const raw = this.data['privateNote'];
    return raw ? toBuff(raw) : undefined;
  }

  set privateNote(note) {
    check(note instanceof Buffer, 'note should be instance of Buffer');
    this.data['privateNote'] = toHexNoPrefix(note);
  }

  /**
   * @property {string|undefined} assetApproveTxHash
   * @desc the transaction hash of asset approving if the deposited asset type is not main asset.
   * Otherwise, it is undefined.
   */
  get assetApproveTxHash() {
    return this.data['assetApproveTxHash'];
  }

  set assetApproveTxHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['assetApproveTxHash'] = hash;
  }

  /**
   * @desc get the full explorer URL of asset approving transaction submitted to the source chain.
   * @param {MystikoConfig} config current effective config.
   * @returns {string|undefined} a full explorer URL of asset approving transaction.
   */
  getAssetApproveTxExplorerUrl(config) {
    check(config instanceof MystikoConfig, 'config should be an instance of MystikoConfig');
    return config.getChainTxExplorerUrl(this.srcChainId, this.assetApproveTxHash);
  }

  /**
   * @property {string} srcTxHash
   * @desc the transaction hash of on the source chain.
   */
  get srcTxHash() {
    return this.data['srcTxHash'];
  }

  set srcTxHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['srcTxHash'] = hash;
  }

  /**
   * @desc get the full explorer URL of depositing transaction submitted to the source chain.
   * @param {MystikoConfig} config current effective config.
   * @returns {string|undefined} a full explorer URL of this depositing transaction.
   */
  getSrcTxExplorerUrl(config) {
    check(config instanceof MystikoConfig, 'config should be an instance of MystikoConfig');
    return config.getChainTxExplorerUrl(this.srcChainId, this.srcTxHash);
  }

  /**
   * @property {string|undefined} bridgeTxHash
   * @desc the transaction hash of on the cross-chain bridge if it is available.
   * If the bridge type of this deposit is loop, then this field is undefined.
   */
  get bridgeTxHash() {
    return this.data['bridgeTxHash'];
  }

  set bridgeTxHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['bridgeTxHash'] = hash;
  }

  /**
   * @desc get the full explorer URL of bridge syncing transaction submitted to the bridge chain.
   * @param {MystikoConfig} config current effective config.
   * @returns {string|undefined} a full explorer URL of this bridge syncing transaction.
   */
  getBridgeTxExplorerUrl(config) {
    check(config instanceof MystikoConfig, 'config should be an instance of MystikoConfig');
    return config.getBridgeTxExplorerUrl(this.bridge, this.bridgeTxHash);
  }

  /**
   * @property {string} dstTxHash
   * @desc the transaction hash of on the destination chain.
   * If the bridge type of this deposit is loop, then this field is equal to {@link Deposit#srcTxHash}.
   */
  get dstTxHash() {
    return this.data['dstTxHash'];
  }

  set dstTxHash(hash) {
    check(typeof hash === 'string', 'hash should be instance of string');
    this.data['dstTxHash'] = hash;
  }

  /**
   * @desc get the full explorer URL of syncing transaction submitted to the destination chain.
   * @param {MystikoConfig} config current effective config.
   * @returns {string|undefined} a full explorer URL of this syncing transaction on the destination chain.
   */
  getDstTxExplorerUrl(config) {
    check(config instanceof MystikoConfig, 'config should be an instance of MystikoConfig');
    return config.getChainTxExplorerUrl(this.dstChainId, this.dstTxHash);
  }

  /**
   * @property {number} walletId
   * @desc the associated {@link Wallet#id} of this deposit.
   */
  get walletId() {
    return this.data['walletId'];
  }

  set walletId(id) {
    check(typeof id === 'number', 'id should be instance of string');
    this.data['walletId'] = id;
  }

  /**
   * @property {string} srcAddress
   * @desc the account address on source chain which this deposit was sent from.
   */
  get srcAddress() {
    return this.data['srcAddress'];
  }

  set srcAddress(address) {
    check(typeof address === 'string', 'srcAddress should be instance of string');
    this.data['srcAddress'] = address;
  }

  /**
   * @property {string} shieldedRecipientAddress
   * @desc the shielded recipient address of which this deposit was sent to.
   */
  get shieldedRecipientAddress() {
    return this.data['shieldedRecipientAddress'];
  }

  set shieldedRecipientAddress(address) {
    check(typeof address === 'string', 'shieldedRecipientAddress should be instance of string');
    this.data['shieldedRecipientAddress'] = address;
  }

  /**
   * @property {module:mystiko/models.DepositStatus} status
   * @desc status of this deposit.
   */
  get status() {
    return this.data['status'];
  }

  set status(s) {
    check(isValidDepositStatus(s), 'invalid deposit status ' + s);
    this.data['status'] = s;
  }

  /**
   * @property {string|undefined} errorMessage
   * @desc error message during the execution of this deposit transaction.
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
 * @typedef DepositStatus
 * @name module:mystiko/models.DepositStatus
 * @desc status enums of the deposit transactions.
 * @property {string} INIT this status will be set immediately after the Deposit object
 * is created and saved to database.
 * @property {string} ASSET_APPROVING this status will be set after the asset approving transaction
 * is successfully submitted to the transaction queue on the source blockchain.
 * @property {string} ASSET_APPROVED this status will be set after the asset approving transaction
 * is successfully confirmed on the source blockchain.
 * @property {string} SRC_PENDING this status will be set after the asset depositing transaction
 * is successfully submitted to the transaction queue on the source blockchain.
 * @property {string} SRC_CONFIRMED this status will be set after the asset depositing transaction
 * is successfully confirmed on the source blockchain.
 * @property {string} BRIDGE_PENDING this status will be set after the asset depositing transaction
 * is successfully submitted to the transaction queue on the cross-chain bridge.
 * @property {string} BRIDGE_CONFIRMED this status will be set after the asset depositing transaction
 * is successfully confirmed on the cross-chain bridge.
 * @property {string} DST_PENDING this status will be set after the asset depositing transaction
 * is successfully submitted to the transaction queue on the destination blockchain.
 * @property {string} SUCCEEDED this status will be set after the asset depositing transaction
 * is successfully confirmed on the destination blockchain.
 * @property {string} FAILED this status will be set after seeing any errors raised during the whole
 * lifecycle of this deposit.
 */
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

/**
 * @function module:mystiko/models.isValidDepositStatus
 * @desc check whether given status string is a valid {@link module:mystiko/models.DepositStatus}.
 * @param {string} status
 * @returns {boolean} true if {@link module:mystiko/models.DepositStatus} contains it, otherwise it returns false.
 */
export function isValidDepositStatus(status) {
  return Object.values(DepositStatus).includes(status);
}
