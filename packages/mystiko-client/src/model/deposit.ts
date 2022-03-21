import BN from 'bn.js';
import { ethers } from 'ethers';
import {
  MystikoConfig,
  BridgeType,
  isValidBridgeType,
  AssetType,
  isValidAssetType,
} from '@mystikonetwork/config';
import { check, fromDecimals, toBuff, toHexNoPrefix, toBN } from '@mystikonetwork/utils';
import { BaseModel } from './common';

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
export enum DepositStatus {
  INIT = 'init',
  ASSET_APPROVING = 'assetApproving',
  ASSET_APPROVED = 'assetApproved',
  SRC_PENDING = 'srcPending',
  SRC_CONFIRMED = 'srcSucceeded',
  BRIDGE_PENDING = 'bridgePending',
  BRIDGE_CONFIRMED = 'bridgeSucceeded',
  DST_PENDING = 'dstPending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

/**
 * @function module:mystiko/models.isValidDepositStatus
 * @desc check whether given status string is a valid {@link module:mystiko/models.DepositStatus}.
 * @param {string} status
 * @returns {boolean} true if {@link module:mystiko/models.DepositStatus} contains it, otherwise it returns false.
 */
export function isValidDepositStatus(status: DepositStatus): boolean {
  return Object.values(DepositStatus).includes(status);
}

export interface RawDeposit {
  srcChainId?: number;
  dstChainId?: number;
  bridge?: BridgeType;
  asset?: string;
  assetType?: AssetType;
  assetDecimals?: number;
  amount?: string;
  commitmentHash?: string;
  randomS?: string;
  hashK?: string;
  privateNote?: string;
  assetApproveTxHash?: string;
  srcTxHash?: string;
  bridgeTxHash?: string;
  dstTxHash?: string;
  walletId?: number;
  srcAddress?: string;
  shieldedRecipientAddress?: string;
  errorMessage?: string;
  status?: DepositStatus;
}

/**
 * @class Deposit
 * @extends BaseModel
 * @param {Object} [data={}] raw data of the Account model.
 * @desc data model for storing deposit transaction data.
 */
export class Deposit extends BaseModel {
  constructor(data: Object = {}) {
    super(data);
  }

  /**
   * @property {number | undefined} srcChainId
   * @desc the source chain id where this deposit was created.
   */
  public get srcChainId(): number | undefined {
    return this.asRawDeposit().srcChainId;
  }

  public set srcChainId(id: number | undefined) {
    this.asRawDeposit().srcChainId = id;
  }

  /**
   * @property {number | undefined} dstChainId
   * @desc the destination chain id where this deposit was created.
   * If the {@link PrivateNote#bridge} is loop, this field equals
   * {@link PrivateNote#srcChainId}.
   */
  public get dstChainId(): number | undefined {
    return this.asRawDeposit().dstChainId;
  }

  public set dstChainId(id: number | undefined) {
    this.asRawDeposit().dstChainId = id;
  }

  /**
   * @property {BridgeType | undefined} bridge
   * @desc the type of cross-chain for this deposit.
   */
  public get bridge(): BridgeType | undefined {
    return this.asRawDeposit().bridge;
  }

  public set bridge(b: BridgeType | undefined) {
    check(!b || isValidBridgeType(b), `${b} is an invalid BridgeType`);
    this.asRawDeposit().bridge = b;
  }

  /**
   * @property {string | undefined} asset
   * @desc the asset symbol of this deposit on the source chain.
   */
  public get asset(): string | undefined {
    return this.asRawDeposit().asset;
  }

  public set asset(a: string | undefined) {
    this.asRawDeposit().asset = a;
  }

  /**
   * @property {AssetType | undefined} assetType
   * @desc the type of the supported asset of this deposit on the source chain.
   */
  public get assetType(): AssetType | undefined {
    return this.asRawDeposit().assetType;
  }

  public set assetType(type: AssetType | undefined) {
    check(!type || isValidAssetType(type), `${type} is an invalid AssetType`);
    this.asRawDeposit().assetType = type;
  }

  /**
   * @property {number | undefined} assetDecimals
   * @desc the asset decimals of this deposit on the source chain.
   */
  public get assetDecimals(): number | undefined {
    return this.asRawDeposit().assetDecimals;
  }

  public set assetDecimals(decimals: number | undefined) {
    this.asRawDeposit().assetDecimals = decimals;
  }

  /**
   * @property {BN | undefined} amount
   * @desc the amount of asset this deposit.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  public get amount(): BN | undefined {
    const raw = this.asRawDeposit().amount;
    return raw ? toBN(raw) : undefined;
  }

  public set amount(amnt: BN | undefined) {
    this.asRawDeposit().amount = amnt ? amnt.toString() : undefined;
  }

  /**
   * @property {number | undefined} simpleAmount
   * @desc the simple amount of asset this deposit without decimals.
   */
  public get simpleAmount(): number | undefined {
    return this.amount ? fromDecimals(this.amount, this.assetDecimals) : undefined;
  }

  /**
   * @property {BN | undefined} commitmentHash
   * @desc hash of the commitment of this deposit.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  public get commitmentHash(): BN | undefined {
    const raw = this.asRawDeposit().commitmentHash;
    return raw ? toBN(raw) : undefined;
  }

  public set commitmentHash(hash: BN | undefined) {
    this.asRawDeposit().commitmentHash = hash ? hash.toString() : undefined;
  }

  /**
   * @property {BN | undefined} randomS
   * @desc the random S parameter of this deposit for generating commitment.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  public get randomS(): BN | undefined {
    const raw = this.asRawDeposit().randomS;
    return raw ? toBN(raw) : undefined;
  }

  public set randomS(s: BN | undefined) {
    this.asRawDeposit().randomS = s ? s.toString() : undefined;
  }

  /**
   * @property {BN | undefined} hashK
   * @desc the intermediate hash K of this deposit for generating commitment.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  public get hashK(): BN | undefined {
    const raw = this.asRawDeposit().hashK;
    return raw ? toBN(raw) : undefined;
  }

  public set hashK(k: BN | undefined) {
    this.asRawDeposit().hashK = k ? k.toString() : undefined;
  }

  /**
   * @property {Buffer | undefined} privateNote
   * @desc encrypted on chain private note data of this deposit.
   * Use {@link module:mystiko/utils.toHex} to convert it to hex string.
   */
  public get privateNote(): Buffer | undefined {
    const raw = this.asRawDeposit().privateNote;
    return raw ? toBuff(raw) : undefined;
  }

  public set privateNote(note: Buffer | undefined) {
    this.asRawDeposit().privateNote = note ? toHexNoPrefix(note) : undefined;
  }

  /**
   * @property {string | undefined} assetApproveTxHash
   * @desc the transaction hash of asset approving if the deposited asset type is not main asset.
   * Otherwise, it is undefined.
   */
  public get assetApproveTxHash(): string | undefined {
    return this.asRawDeposit().assetApproveTxHash;
  }

  public set assetApproveTxHash(hash: string | undefined) {
    this.asRawDeposit().assetApproveTxHash = hash;
  }

  /**
   * @desc get the full explorer URL of asset approving transaction submitted to the source chain.
   * @param {MystikoConfig} config current effective config.
   * @returns {string | undefined} a full explorer URL of asset approving transaction.
   */
  public getAssetApproveTxExplorerUrl(config: MystikoConfig): string | undefined {
    return this.srcChainId && this.assetApproveTxHash
      ? config.getChainTxExplorerUrl(this.srcChainId, this.assetApproveTxHash)
      : undefined;
  }

  /**
   * @property {string | undefined} srcTxHash
   * @desc the transaction hash of on the source chain.
   */
  public get srcTxHash(): string | undefined {
    return this.asRawDeposit().srcTxHash;
  }

  public set srcTxHash(hash: string | undefined) {
    this.asRawDeposit().srcTxHash = hash;
  }

  /**
   * @desc get the full explorer URL of depositing transaction submitted to the source chain.
   * @param {MystikoConfig} config current effective config.
   * @returns {string | undefined} a full explorer URL of this depositing transaction.
   */
  public getSrcTxExplorerUrl(config: MystikoConfig): string | undefined {
    return this.srcChainId && this.srcTxHash
      ? config.getChainTxExplorerUrl(this.srcChainId, this.srcTxHash)
      : undefined;
  }

  /**
   * @property {string | undefined} bridgeTxHash
   * @desc the transaction hash of on the cross-chain bridge if it is available.
   * If the bridge type of this deposit is loop, then this field is undefined.
   */
  public get bridgeTxHash(): string | undefined {
    return this.asRawDeposit().bridgeTxHash;
  }

  public set bridgeTxHash(hash: string | undefined) {
    this.asRawDeposit().bridgeTxHash = hash;
  }

  /**
   * @desc get the full explorer URL of bridge syncing transaction submitted to the bridge chain.
   * @param {MystikoConfig} config current effective config.
   * @returns {string | undefined} a full explorer URL of this bridge syncing transaction.
   */
  public getBridgeTxExplorerUrl(config: MystikoConfig): string | undefined {
    return this.bridge && this.bridgeTxHash
      ? config.getBridgeTxExplorerUrl(this.bridge, this.bridgeTxHash)
      : undefined;
  }

  /**
   * @property {string} dstTxHash
   * @desc the transaction hash of on the destination chain.
   * If the bridge type of this deposit is loop, then this field is equal to {@link Deposit#srcTxHash}.
   */
  public get dstTxHash(): string | undefined {
    return this.asRawDeposit().dstTxHash;
  }

  public set dstTxHash(hash: string | undefined) {
    this.asRawDeposit().dstTxHash = hash;
  }

  /**
   * @desc get the full explorer URL of syncing transaction submitted to the destination chain.
   * @param {MystikoConfig} config current effective config.
   * @returns {string | undefined} a full explorer URL of this syncing transaction on the destination chain.
   */
  public getDstTxExplorerUrl(config: MystikoConfig): string | undefined {
    return this.dstChainId && this.dstTxHash
      ? config.getChainTxExplorerUrl(this.dstChainId, this.dstTxHash)
      : undefined;
  }

  /**
   * @property {number | undefined} walletId
   * @desc the associated {@link Wallet#id} of this deposit.
   */
  public get walletId(): number | undefined {
    return this.asRawDeposit().walletId;
  }

  public set walletId(id: number | undefined) {
    this.asRawDeposit().walletId = id;
  }

  /**
   * @property {string | undefined} srcAddress
   * @desc the account address on source chain which this deposit was sent from.
   */
  public get srcAddress(): string | undefined {
    return this.asRawDeposit().srcAddress;
  }

  public set srcAddress(address: string | undefined) {
    check(!address || ethers.utils.isAddress(address), `${address} is an invalid address`);
    this.asRawDeposit().srcAddress = address;
  }

  /**
   * @property {string | undefined} shieldedRecipientAddress
   * @desc the shielded recipient address of which this deposit was sent to.
   */
  public get shieldedRecipientAddress(): string | undefined {
    return this.asRawDeposit().shieldedRecipientAddress;
  }

  public set shieldedRecipientAddress(address: string | undefined) {
    check(!address || this.protocol.isShieldedAddress(address), `${address} is an invalid shielded address`);
    this.asRawDeposit().shieldedRecipientAddress = address;
  }

  /**
   * @property {module:mystiko/models.DepositStatus | undefined} status
   * @desc status of this deposit.
   */
  public get status(): DepositStatus | undefined {
    return this.asRawDeposit().status;
  }

  public set status(s: DepositStatus | undefined) {
    check(!s || isValidDepositStatus(s), `${s} is an invalid DepositStatus`);
    this.asRawDeposit().status = s;
  }

  /**
   * @property {string | undefined} errorMessage
   * @desc error message during the execution of this deposit transaction.
   * If the status is SUCCEEDED, this field is undefined.
   */
  public get errorMessage(): string | undefined {
    return this.asRawDeposit().errorMessage;
  }

  public set errorMessage(msg: string | undefined) {
    this.asRawDeposit().errorMessage = msg;
  }

  private asRawDeposit(): RawDeposit {
    return this.data as RawDeposit;
  }
}
