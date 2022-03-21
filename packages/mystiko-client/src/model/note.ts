import BN from 'bn.js';
import { ethers } from 'ethers';
import { MystikoConfig, isValidBridgeType, BridgeType } from '@mystikonetwork/config';
import { check, fromDecimals, toBuff, toHexNoPrefix, toBN } from '@mystikonetwork/utils';
import { BaseModel } from './common';

/**
 * @typedef PrivateNoteStatus
 * @name module:mystiko/models.PrivateNoteStatus
 * @desc status enum of private notes.
 * @property {string} IMPORTED status indicates the private note is successfully imported.
 * @property {string} SPENT status indicates the private note is sucessfully spent.
 */
export enum PrivateNoteStatus {
  IMPORTED = 'imported',
  SPENT = 'spent',
}

/**
 * @function module:mystiko/models.isValidPrivateNoteStatus
 * @desc check whether given status is a valid PrivateNote status.
 * @param {string} status
 * @returns {boolean} true if {@link module:mystiko/models.PrivateNoteStatus} contains it, otherwise it returns false.
 */
export function isValidPrivateNoteStatus(status: PrivateNoteStatus): boolean {
  return Object.values(PrivateNoteStatus).includes(status);
}

export interface RawPrivateNote {
  srcChainId?: number;
  srcTransactionHash?: string;
  srcAsset?: string;
  srcAssetAddress?: string;
  srcAssetDecimals?: number;
  srcProtocolAddress?: string;
  amount?: string;
  bridge?: BridgeType;
  dstChainId?: number;
  dstTransactionHash?: string;
  dstAsset?: string;
  dstAssetAddress?: string;
  dstAssetDecimals?: number;
  dstProtocolAddress?: string;
  commitmentHash?: string;
  encryptedOnChainNote?: string;
  walletId?: number;
  shieldedAddress?: string;
  withdrawTransactionHash?: string;
  status?: PrivateNoteStatus;
}

/**
 * @class PrivateNote
 * @extends BaseModel
 * @param {Object} [data={}] raw data of the Account model.
 * @desc data model for storing combined on-chain private note data and deposit transaction data.
 */
export class PrivateNote extends BaseModel {
  constructor(data: Object = {}) {
    super(data);
  }

  /**
   * @property {number | undefined} srcChainId
   * @desc the source chain id where the underlying deposit was created.
   */
  public get srcChainId(): number | undefined {
    return this.asRawPrivateNote().srcChainId;
  }

  public set srcChainId(id: number | undefined) {
    check(typeof id === 'number', 'srcChainId should be instance of number');
    this.asRawPrivateNote().srcChainId = id;
  }

  /**
   * @property {string | undefined} srcTransactionHash
   * @desc the transaction hash of the underlying deposit on the source chain.
   */
  public get srcTransactionHash(): string | undefined {
    return this.asRawPrivateNote().srcTransactionHash;
  }

  public set srcTransactionHash(hash: string | undefined) {
    this.asRawPrivateNote().srcTransactionHash = hash;
  }

  /**
   * @desc get the explorer URL for transaction in source chain.
   * @param {MystikoConfig} config current effective config.
   * @returns {string | undefined} a full URL of source chain transaction. It returns undefined if source chain config
   * is not provided or the transaction hash of source chain is not set.
   */
  public getSrcTxExplorerUrl(config: MystikoConfig): string | undefined {
    return this.srcChainId && this.srcTransactionHash
      ? config.getChainTxExplorerUrl(this.srcChainId, this.srcTransactionHash)
      : undefined;
  }

  /**
   * @property {string | undefined} srcAsset
   * @desc the asset symbol of the underlying deposit on the source chain.
   */
  public get srcAsset(): string | undefined {
    return this.asRawPrivateNote().srcAsset;
  }

  public set srcAsset(token: string | undefined) {
    this.asRawPrivateNote().srcAsset = token;
  }

  /**
   * @property {string | undefined} srcAssetAddress
   * @desc the asset contract address of the underlying deposit on the source chain.
   */
  public get srcAssetAddress(): string | undefined {
    return this.asRawPrivateNote().srcAssetAddress;
  }

  public set srcAssetAddress(address: string | undefined) {
    check(!address || ethers.utils.isAddress(address), `${address} is an invalid address`);
    this.asRawPrivateNote().srcAssetAddress = address;
  }

  /**
   * @property {number | undefined} srcAssetDecimals
   * @desc the asset number of decimals of the underlying deposit on the source chain.
   */
  public get srcAssetDecimals(): number | undefined {
    return this.asRawPrivateNote().srcAssetDecimals;
  }

  public set srcAssetDecimals(decimals: number | undefined) {
    this.asRawPrivateNote().srcAssetDecimals = decimals;
  }

  /**
   * @property {string | undefined} srcProtocolAddress
   * @desc the Mystiko protocol contract address on the source chain of the underlying deposit was sent to.
   */
  public get srcProtocolAddress(): string | undefined {
    return this.asRawPrivateNote().srcProtocolAddress;
  }

  public set srcProtocolAddress(address: string | undefined) {
    check(!address || ethers.utils.isAddress(address), `${address} is an invalid address`);
    this.asRawPrivateNote().srcProtocolAddress = address;
  }

  /**
   * @property {BN | undefined} amount
   * @desc the amount of asset the underlying deposit.
   */
  public get amount(): BN | undefined {
    const raw = this.asRawPrivateNote().amount;
    return raw ? toBN(raw) : undefined;
  }

  public set amount(amnt: BN | undefined) {
    this.asRawPrivateNote().amount = amnt ? amnt.toString() : undefined;
  }

  /**
   * @property {number | undefined} simpleAmount
   * @desc the simple amount of asset this privateNote without decimals.
   */
  public get simpleAmount(): number | undefined {
    return this.amount ? fromDecimals(this.amount, this.dstAssetDecimals) : undefined;
  }

  /**
   * @property {BridgeType | undefined} bridge
   * @desc the type of cross-chain for the underlying deposit.
   */
  public get bridge(): BridgeType | undefined {
    return this.asRawPrivateNote().bridge;
  }

  public set bridge(b: BridgeType | undefined) {
    check(!b || isValidBridgeType(b), `${b} is an invalid BridgeType`);
    this.asRawPrivateNote().bridge = b || undefined;
  }

  /**
   * @property {number | undefined} dstChainId
   * @desc the destination chain id where the underlying deposit was created.
   * If the {@link PrivateNote#bridge} is loop, this field equals
   * {@link PrivateNote#srcChainId}.
   */
  public get dstChainId(): number | undefined {
    return this.asRawPrivateNote().dstChainId;
  }

  public set dstChainId(id: number | undefined) {
    this.asRawPrivateNote().dstChainId = id;
  }

  /**
   * @property {string | undefined} dstTransactionHash
   * @desc the transaction hash of the underlying deposit on the destination chain.
   * If the {@link PrivateNote#bridge} is loop, this field equals
   * {@link PrivateNote#srcTransactionHash}.
   */
  public get dstTransactionHash(): string | undefined {
    return this.asRawPrivateNote().dstTransactionHash;
  }

  public set dstTransactionHash(hash: string | undefined) {
    this.asRawPrivateNote().dstTransactionHash = hash;
  }

  /**
   * @desc get the explorer URL for transaction in destination chain.
   * @param {MystikoConfig} config current effective config.
   * @returns {string | undefined} a full URL of destination chain transaction. It returns undefined if destination chain config
   * is not provided or the transaction hash of destination chain is not set.
   */
  public getDstTxExplorerUrl(config: MystikoConfig): string | undefined {
    return this.dstChainId && this.dstTransactionHash
      ? config.getChainTxExplorerUrl(this.dstChainId, this.dstTransactionHash)
      : undefined;
  }

  /**
   * @property {string | undefined} dstAsset
   * @desc the asset symbol of the underlying deposit on the destination chain.
   * If the {@link PrivateNote#bridge} is loop, this field equals
   * {@link PrivateNote#srcAsset}.
   */
  public get dstAsset(): string | undefined {
    return this.asRawPrivateNote().dstAsset;
  }

  public set dstAsset(token: string | undefined) {
    this.asRawPrivateNote().dstAsset = token;
  }

  /**
   * @property {string | undefined} dstAssetAddress
   * @desc the asset contract address of the underlying deposit on the destination chain.
   * If the {@link PrivateNote#bridge} is loop, this field equals
   * {@link PrivateNote#srcAssetAddress}.
   */
  public get dstAssetAddress(): string | undefined {
    return this.asRawPrivateNote().dstAssetAddress;
  }

  public set dstAssetAddress(address: string | undefined) {
    check(!address || ethers.utils.isAddress(address), `${address} is an invalid address`);
    this.asRawPrivateNote().dstAssetAddress = address;
  }

  /**
   * @property {number | undefined} dstAssetDecimals
   * @desc the asset number of decimals of the underlying deposit on the destination chain.
   */
  public get dstAssetDecimals(): number | undefined {
    return this.asRawPrivateNote().dstAssetDecimals;
  }

  public set dstAssetDecimals(decimals: number | undefined) {
    this.asRawPrivateNote().dstAssetDecimals = decimals;
  }

  /**
   * @property {string | undefined} dstProtocolAddress
   * @desc the Mystiko protocol contract address on the destination chain of the underlying deposit was sent to.
   * If the {@link PrivateNote#bridge} is loop, this field equals
   * {@link PrivateNote#srcProtocolAddress}.
   */
  public get dstProtocolAddress(): string | undefined {
    return this.asRawPrivateNote().dstProtocolAddress;
  }

  public set dstProtocolAddress(address: string | undefined) {
    check(!address || ethers.utils.isAddress(address), `${address} is an invalid address`);
    this.asRawPrivateNote().dstProtocolAddress = address;
  }

  /**
   * @property {BN | undefined} commitmentHash
   * @desc hash of the commitment of the underlying deposit.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  public get commitmentHash(): BN | undefined {
    const raw = this.asRawPrivateNote().commitmentHash;
    return raw ? toBN(raw) : undefined;
  }

  public set commitmentHash(hash: BN | undefined) {
    this.asRawPrivateNote().commitmentHash = hash ? hash.toString() : undefined;
  }

  /**
   * @property {Buffer | undefined} encryptedOnChainNote
   * @desc encrypted on chain private note data of the underlying deposit.
   * Use {@link module:mystiko/utils.toHex} to convert it to hex string.
   */
  public get encryptedOnChainNote(): Buffer | undefined {
    const raw = this.asRawPrivateNote().encryptedOnChainNote;
    return raw ? toBuff(raw) : undefined;
  }

  public set encryptedOnChainNote(note: Buffer | undefined) {
    this.asRawPrivateNote().encryptedOnChainNote = note ? toHexNoPrefix(note) : undefined;
  }

  /**
   * @property {number | undefined} walletId
   * @desc the associated {@link Wallet#id} of the underlying deposit.
   */
  public get walletId(): number | undefined {
    return this.asRawPrivateNote().walletId;
  }

  public set walletId(id: number | undefined) {
    this.asRawPrivateNote().walletId = id;
  }

  /**
   * @property {string | undefined} shieldedAddress
   * @desc the shielded address of which the underlying deposit was sent to.
   */
  public get shieldedAddress(): string | undefined {
    return this.asRawPrivateNote().shieldedAddress;
  }

  public set shieldedAddress(address: string | undefined) {
    this.asRawPrivateNote().shieldedAddress = address;
  }

  /**
   * @property {string | undefined} withdrawTransactionHash
   * @desc the withdrawal transaction hash after this private note be spent.
   */
  public get withdrawTransactionHash(): string | undefined {
    return this.asRawPrivateNote().withdrawTransactionHash;
  }

  public set withdrawTransactionHash(hash: string | undefined) {
    this.asRawPrivateNote().withdrawTransactionHash = hash;
  }

  /**
   * @desc get the explorer URL for withdrawal transaction in destination chain.
   * @param {MystikoConfig} config current effective config.
   * @returns {string | undefined} a full URL of destination chain withdrawal transaction. It returns undefined if destination chain config
   * is not provided or the transaction hash of destination chain is not set.
   */
  public getWithdrawTxExplorerUrl(config: MystikoConfig): string | undefined {
    return this.dstChainId && this.withdrawTransactionHash
      ? config.getChainTxExplorerUrl(this.dstChainId, this.withdrawTransactionHash)
      : undefined;
  }

  /**
   * @property {module:mystiko/models.PrivateNoteStatus | undefined} status
   * @desc status of this private note.
   */
  public get status(): PrivateNoteStatus | undefined {
    return this.asRawPrivateNote().status;
  }

  public set status(s: PrivateNoteStatus | undefined) {
    check(!s || isValidPrivateNoteStatus(s), `${s} is an invalid PrivateNoteStatus`);
    this.asRawPrivateNote().status = s;
  }

  private asRawPrivateNote(): RawPrivateNote {
    return this.data as RawPrivateNote;
  }
}
