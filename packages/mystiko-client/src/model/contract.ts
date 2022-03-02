import BN from 'bn.js';
import { ethers } from 'ethers';
import { check } from '@mystiko/utils';
import { MystikoABI, AssetType, BridgeType, isValidAssetType, isValidBridgeType } from '@mystiko/config';
import { BaseModel } from './common';

export interface RawContract {
  version?: number;
  name?: string;
  chainId?: number;
  address?: string;
  assetSymbol?: string;
  assetType?: AssetType;
  assetAddress?: string;
  assetDecimals?: number;
  bridgeType?: BridgeType;
  peerChainId?: number;
  peerContractAddress?: string;
  minBridgeFee?: string;
  syncStart?: number;
  circuits?: string;
  syncedBlock?: number;
}

/**
 * @class Contract
 * @extends BaseModel
 * @param {Object} [data={}] raw data of the Account model.
 * @desc data model for storing smart contract related information.
 */
export class Contract extends BaseModel {
  constructor(data: Object = {}) {
    super(data);
  }

  /**
   * @property {string} version
   * @desc the version number of this deployed contract.
   */
  public get version(): number {
    return this.asRawContract().version || 0;
  }

  public set version(ver: number) {
    this.asRawContract().version = ver;
  }

  /**
   * @property {string | undefined} name
   * @desc the name of this smart contract.
   */
  public get name(): string | undefined {
    return this.asRawContract().name;
  }

  set name(n: string | undefined) {
    this.asRawContract().name = n;
  }

  /**
   * @property {number | undefined} chainId
   * @desc the chain id where this contract was deployed.
   */
  public get chainId(): number | undefined {
    return this.asRawContract().chainId;
  }

  public set chainId(id: number | undefined) {
    this.asRawContract().chainId = id;
  }

  /**
   * @property {string | undefined} address
   * @desc the deployed address of this smart contract.
   */
  public get address(): string | undefined {
    return this.asRawContract().address;
  }

  public set address(addr: string | undefined) {
    check(!addr || ethers.utils.isAddress(addr), `${addr} is an invalid address`);
    this.asRawContract().address = addr;
  }

  /**
   * @property {string | undefined} assetSymbol
   * @desc the asset symbol which this smart contract associates with.
   */
  public get assetSymbol(): string | undefined {
    return this.asRawContract().assetSymbol;
  }

  public set assetSymbol(symbol: string | undefined) {
    this.asRawContract().assetSymbol = symbol;
  }

  /**
   * @property {AssetType | undefined} assetType
   * @desc the asset type which this smart contract associates with,
   * check {@link AssetType AssetType}.
   */
  public get assetType(): AssetType | undefined {
    return this.asRawContract().assetType;
  }

  public set assetType(type: AssetType | undefined) {
    check(!type || isValidAssetType(type), `${type} is an invalid AssetType`);
    this.asRawContract().assetType = type;
  }

  /**
   * @property {string | undefined} assetAddress
   * @desc the asset address which this smart contract associates with.
   */
  public get assetAddress(): string | undefined {
    return this.asRawContract().assetAddress;
  }

  public set assetAddress(addr: string | undefined) {
    check(!addr || ethers.utils.isAddress(addr), `${addr} is an invalid address`);
    this.asRawContract().assetAddress = addr;
  }

  /**
   * @property {number | undefined} assetDecimals
   * @desc the asset decimals of this contract.
   */
  public get assetDecimals(): number | undefined {
    return this.asRawContract().assetDecimals;
  }

  public set assetDecimals(decimals: number | undefined) {
    this.asRawContract().assetDecimals = decimals;
  }

  /**
   * @property {BridgeType | undefined} bridgeType
   * @desc the cross-chain bridge type which this smart contract associates with,
   * check {@link BridgeType BridgeType}.
   */
  public get bridgeType(): BridgeType | undefined {
    return this.asRawContract().bridgeType;
  }

  public set bridgeType(type: BridgeType | undefined) {
    check(!type || isValidBridgeType(type), `${BridgeType} is an invalid BridgeType`);
    this.asRawContract().bridgeType = type;
  }

  /**
   * @property {number | undefined} peerChainId
   * @desc the peer chain id of this smart contract.
   * It is undefined if the bridge type is loop.
   */
  public get peerChainId(): number | undefined {
    return this.asRawContract().peerChainId;
  }

  public set peerChainId(id: number | undefined) {
    this.asRawContract().peerChainId = id;
  }

  /**
   * @property {string | undefined} peerContractAddress
   * @desc the peer chain smart contract address of this smart contract.
   * It is undefined if the bridge type is loop.
   */
  public get peerContractAddress(): string | undefined {
    return this.asRawContract().peerContractAddress;
  }

  public set peerContractAddress(addr: string | undefined) {
    check(!addr || ethers.utils.isAddress(addr), `${addr} is an invalid address`);
    this.asRawContract().peerContractAddress = addr;
  }

  /**
   * @property {BN} minBridgeFee
   * @desc the minimum number of bridge fee if this is a cross-chain contract. The bridge fee amount should be
   * in wei as unit.
   */
  public get minBridgeFee(): BN {
    const rawContract = this.asRawContract();
    return rawContract.minBridgeFee ? new BN(rawContract.minBridgeFee) : new BN(0);
  }

  public set minBridgeFee(fee: BN) {
    check(fee.gte(new BN(0)), 'minBridgeFee should not be a negative number');
    this.asRawContract().minBridgeFee = fee.toString();
  }

  /**
   * @property {number} syncStart
   * @desc the block number from where the application should start synchronization.
   */
  public get syncStart(): number {
    return this.asRawContract().syncStart || 0;
  }

  public set syncStart(blockNumber: number) {
    check(blockNumber >= 0, 'syncStart should not be a negative number');
    this.asRawContract().syncStart = blockNumber;
  }

  /**
   * @property {string | undefined} circuits
   * @desc the scheme name of zkp circuits of this smart contract.
   */
  public get circuits(): string | undefined {
    return this.asRawContract().circuits;
  }

  public set circuits(scheme: string | undefined) {
    this.asRawContract().circuits = scheme;
  }

  /**
   * @property {number} syncedBlock
   * @desc the block number of the last synchronized block.
   */
  public get syncedBlock(): number {
    return this.asRawContract().syncedBlock || 0;
  }

  public set syncedBlock(blockNumber: number) {
    this.asRawContract().syncedBlock = blockNumber;
  }

  /**
   * @property {any} abi
   * @desc the compiled ABI encoding information of this configured smart contract.
   */
  public get abi(): any {
    return this.name ? MystikoABI[this.name]?.abi : undefined;
  }

  private asRawContract(): RawContract {
    return this.data as RawContract;
  }
}
