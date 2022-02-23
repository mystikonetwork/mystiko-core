import { ethers } from 'ethers';

import { BaseModel, isValidAssetType, isValidBridgeType } from './common.js';
import { check } from '@mystiko/utils';
import { MystikoABI } from '../chain/abi.js';

/**
 * @class Contract
 * @extends BaseModel
 * @param {Object} [data={}] raw data of the Account model.
 * @desc data model for storing smart contract related information.
 */
export class Contract extends BaseModel {
  constructor(data) {
    super(data);
  }

  /**
   * @property {number} version
   * @desc the version number of this deployed contract.
   */
  get version() {
    return this.data['version'] ? this.data['version'] : 0;
  }

  set version(ver) {
    check(typeof ver === 'number', 'ver should be instance of number');
    this.data['version'] = ver;
  }

  /**
   * @property {string} name
   * @desc the name of this smart contract.
   */
  get name() {
    return this.data['name'];
  }

  set name(n) {
    check(typeof n === 'string', 'name should be a string type');
    this.data['name'] = n;
  }

  /**
   * @property {number} chainId
   * @desc the chain id where this contract was deployed.
   */
  get chainId() {
    return this.data['chainId'];
  }

  set chainId(id) {
    check(typeof id === 'number', 'id should be instance of number');
    this.data['chainId'] = id;
  }

  /**
   * @property {string} address
   * @desc the deployed address of this smart contract.
   */
  get address() {
    return this.data['address'];
  }

  set address(addr) {
    check(ethers.utils.isAddress(addr), `addr ${addr} is invalid address`);
    this.data['address'] = addr;
  }

  /**
   * @property {string} assetSymbol
   * @desc the asset symbol which this smart contract associates with.
   */
  get assetSymbol() {
    return this.data['assetSymbol'];
  }

  set assetSymbol(symbol) {
    check(typeof symbol === 'string', 'symbol should be a string type');
    this.data['assetSymbol'] = symbol;
  }

  /**
   * @property {module:mystiko/models.AssetType} assetType
   * @desc the asset type which this smart contract associates with,
   * check {@link module:mystiko/models.AssetType AssetType}.
   */
  get assetType() {
    return this.data['assetType'];
  }

  set assetType(type) {
    check(isValidAssetType(type), `type ${type} is invalid AssetType`);
    this.data['assetType'] = type;
  }

  /**
   * @property {string} assetAddress
   * @desc the asset address which this smart contract associates with.
   */
  get assetAddress() {
    return this.data['assetAddress'];
  }

  set assetAddress(addr) {
    check(!addr || ethers.utils.isAddress(addr), `addr ${addr} is invalid address`);
    this.data['assetAddress'] = addr;
  }

  /**
   * @property {number} assetDecimals
   * @desc the asset decimals of this contract.
   */
  get assetDecimals() {
    return this.data['assetDecimals'];
  }

  set assetDecimals(decimals) {
    check(typeof decimals === 'number', 'decimals should be a number');
    this.data['assetDecimals'] = decimals;
  }

  /**
   * @property {module:mystiko/models.BridgeType} bridgeType
   * @desc the cross-chain bridge type which this smart contract associates with,
   * check {@link module:mystiko/models.BridgeType BridgeType}.
   */
  get bridgeType() {
    return this.data['bridgeType'];
  }

  set bridgeType(type) {
    check(isValidBridgeType(type), `type ${type} is invalid BridgeType`);
    this.data['bridgeType'] = type;
  }

  /**
   * @property {number} peerChainId
   * @desc the peer chain id of this smart contract.
   * It is undefined if the bridge type is loop.
   */
  get peerChainId() {
    return this.data['peerChainId'];
  }

  set peerChainId(id) {
    check(!id || typeof id === 'number', 'id should be a number type');
    this.data['peerChainId'] = id;
  }

  /**
   * @property {string} peerContractAddress
   * @desc the peer chain smart contract address of this smart contract.
   * It is undefined if the bridge type is loop.
   */
  get peerContractAddress() {
    return this.data['peerContractAddress'];
  }

  set peerContractAddress(addr) {
    check(!addr || ethers.utils.isAddress(addr), `addr ${addr} is invalid address`);
    this.data['peerContractAddress'] = addr;
  }

  /**
   * @property {string} circuits
   * @desc the scheme name of zkp circuits of this smart contract.
   */
  get circuits() {
    return this.data['circuits'];
  }

  set circuits(scheme) {
    check(typeof scheme === 'string', 'scheme should be a string type');
    this.data['circuits'] = scheme;
  }

  /**
   * @property {number} syncedBlock
   * @desc the block number of the last synchronized block.
   */
  get syncedBlock() {
    return this.data['syncedBlock'];
  }

  set syncedBlock(blockNumber) {
    check(typeof blockNumber === 'number', 'blockNumber should be a number type');
    this.data['syncedBlock'] = blockNumber;
  }

  /**
   * @property {Object} abi
   * @desc the compiled ABI encoding information of this configured smart contract.
   */
  get abi() {
    return MystikoABI[this.name].abi;
  }
}
