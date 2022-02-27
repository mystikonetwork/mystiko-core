import BN from 'bn.js';
import { ethers } from 'ethers';
import { check, fromDecimals, toBN } from '@mystiko/utils';
import { MystikoConfig } from '@mystiko/config';
import { BaseModel } from './common';

/**
 * @typedef WithdrawStatus
 * @name module:mystiko/models.WithdrawStatus
 * @desc status enums of the withdrawal transactions.
 * @property {string} INIT this status will be set immediately after the Withdraw object
 * is created and saved to database.
 * @property {string} GENERATING_PROOF this status will be set when zkSnark proofs are being generated.
 * @property {string} PROOF_GENERATED this status will be set when zkSnark proofs are generated successfully.
 * @property {string} PENDING this status will be set after the withdrawal transaction is successfully
 * submitted to the destination blockchain.
 * @property {string} SUCCEEDED this status will be set after the withdrawal transaction
 * is successfully confirmed on the destination blockchain.
 * @property {string} FAILED this status will be set after seeing any errors raised during the whole
 * lifecycle of this withdrawal transaction.
 */
export enum WithdrawStatus {
  INIT = 'init',
  GENERATING_PROOF = 'generatingProof',
  PROOF_GENERATED = 'proofGenerated',
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

/**
 * @function module:mystiko/models.isValidWithdrawStatus
 * @desc check whether given status string is a valid {@link module:mystiko/models.WithdrawStatus}.
 * @param {string} status
 * @returns {boolean} true if {@link module:mystiko/models.WithdrawStatus} contains it, otherwise it returns false.
 */
export function isValidWithdrawStatus(status: WithdrawStatus): boolean {
  return Object.values(WithdrawStatus).includes(status);
}

export interface RawWithdraw {
  chainId?: number;
  asset?: string;
  assetDecimals?: number;
  assetAddress?: string;
  merkleRootHash?: string;
  serialNumber?: string;
  amount?: string;
  recipientAddress?: string;
  transactionHash?: string;
  walletId?: number;
  shieldedAddress?: string;
  privateNoteId?: number;
  errorMessage?: string;
  status?: WithdrawStatus;
}

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
   * @property {number | undefined} chainId
   * @desc the destination chain id where this withdrawal transaction was created.
   */
  public get chainId(): number | undefined {
    return this.asRawWithdraw().chainId;
  }

  public set chainId(id: number | undefined) {
    this.asRawWithdraw().chainId = id;
  }

  /**
   * @property {string | undefined} asset
   * @desc the asset symbol of this withdrawal transaction.
   */
  public get asset(): string | undefined {
    return this.asRawWithdraw().asset;
  }

  public set asset(t: string | undefined) {
    this.asRawWithdraw().asset = t;
  }

  /**
   * @property {number | undefined} assetDecimals
   * @desc the asset decimals of this withdrawal transaction on the source chain.
   */
  public get assetDecimals(): number | undefined {
    return this.asRawWithdraw().assetDecimals;
  }

  public set assetDecimals(decimals: number | undefined) {
    this.asRawWithdraw().assetDecimals = decimals;
  }

  /**
   * @property {string | undefined} assetAddress
   * @desc the asset address of this withdrawal transaction.
   */
  public get assetAddress(): string | undefined {
    return this.asRawWithdraw().assetAddress;
  }

  public set assetAddress(address: string | undefined) {
    check(!address || ethers.utils.isAddress(address), `${address} is an invalid address`);
    this.asRawWithdraw().assetAddress = address;
  }

  /**
   * @property {BN | undefined} merkleRootHash
   * @desc the calculated merkle root hash when this withdrawal transaction was created.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  public get merkleRootHash(): BN | undefined {
    const raw = this.asRawWithdraw().merkleRootHash;
    return raw ? toBN(raw) : undefined;
  }

  public set merkleRootHash(hash: BN | undefined) {
    this.asRawWithdraw().merkleRootHash = hash ? hash.toString() : undefined;
  }

  /**
   * @property {BN | undefined} serialNumber
   * @desc the calculated serial number for the deposit which this withdrawal transaction being spending.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  public get serialNumber(): BN | undefined {
    const raw = this.asRawWithdraw().serialNumber;
    return raw ? toBN(raw) : undefined;
  }

  public set serialNumber(sn: BN | undefined) {
    this.asRawWithdraw().serialNumber = sn ? sn.toString() : undefined;
  }

  /**
   * @property {BN | undefined} amount
   * @desc the amount of asset for this withdrawal transaction.
   * Use {@link module:mystiko/utils.toString} to convert it to string.
   */
  public get amount(): BN | undefined {
    const raw = this.asRawWithdraw().amount;
    return raw ? toBN(raw) : undefined;
  }

  public set amount(amnt: BN | undefined) {
    this.asRawWithdraw().amount = amnt ? amnt.toString() : undefined;
  }

  /**
   * @property {number | undefined} simpleAmount
   * @desc the simple amount of asset this withdrawal transaction without decimals.
   */
  public get simpleAmount(): number | undefined {
    return this.amount ? fromDecimals(this.amount, this.assetDecimals) : undefined;
  }

  /**
   * @property {string | undefined} recipientAddress
   * @desc the recipient address of this withdrawal transaction.
   */
  public get recipientAddress(): string | undefined {
    return this.asRawWithdraw().recipientAddress;
  }

  public set recipientAddress(address: string | undefined) {
    this.asRawWithdraw().recipientAddress = address;
  }

  /**
   * @property {string | undefined} transactionHash
   * @desc the transaction hash of this withdrawal transaction after it is submitted.
   */
  public get transactionHash(): string | undefined {
    return this.asRawWithdraw().transactionHash;
  }

  public set transactionHash(hash: string | undefined) {
    this.asRawWithdraw().transactionHash = hash;
  }

  /**
   * @desc get the full explorer URL of withdrawal transaction.
   * @param {MystikoConfig} config current effective config.
   * @returns {string|undefined} a full explorer URL of this withdrawal transaction.
   */
  public getTxExplorerUrl(config: MystikoConfig): string | undefined {
    return this.chainId && this.transactionHash
      ? config.getChainTxExplorerUrl(this.chainId, this.transactionHash)
      : undefined;
  }

  /**
   * @property {number | undefined} walletId
   * @desc the associated {@link Wallet#id} of this withdrawal transaction.
   */
  public get walletId(): number | undefined {
    return this.asRawWithdraw().walletId;
  }

  public set walletId(id: number | undefined) {
    this.asRawWithdraw().walletId = id;
  }

  /**
   * @property {string | undefined} shieldedAddress
   * @desc the shielded address of this withdrawal transaction when it uses to calculate proofs.
   */
  public get shieldedAddress(): string | undefined {
    return this.asRawWithdraw().shieldedAddress;
  }

  public set shieldedAddress(address: string | undefined) {
    this.asRawWithdraw().shieldedAddress = address;
  }

  /**
   * @property {number | undefined} privateNoteId
   * @desc the associated {@link PrivateNote#id} of this withdrawal transaction.
   */
  public get privateNoteId(): number | undefined {
    return this.asRawWithdraw().privateNoteId;
  }

  public set privateNoteId(id: number | undefined) {
    this.asRawWithdraw().privateNoteId = id;
  }

  /**
   * @property {module:mystiko/models.WithdrawStatus | undefined} status
   * @desc status of this withdrawal transaction.
   */
  public get status(): WithdrawStatus | undefined {
    return this.asRawWithdraw().status;
  }

  public set status(s: WithdrawStatus | undefined) {
    check(!s || isValidWithdrawStatus(s), `${s} is an invalid WithdrawStatus`);
    this.asRawWithdraw().status = s;
  }

  /**
   * @property {string | undefined} errorMessage
   * @desc error message during the execution of this withdrawal transaction.
   * If the status is SUCCEEDED, this field is undefined.
   */
  public get errorMessage(): string | undefined {
    return this.asRawWithdraw().errorMessage;
  }

  public set errorMessage(msg: string | undefined) {
    this.asRawWithdraw().errorMessage = msg;
  }

  private asRawWithdraw(): RawWithdraw {
    return this.data as RawWithdraw;
  }
}
