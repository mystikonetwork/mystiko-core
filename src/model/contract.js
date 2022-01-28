import { ethers } from 'ethers';

import { BaseModel, isValidAssetType, isValidBridgeType } from './common.js';
import { check } from '../utils.js';

/**
 * @class Contract
 */
export class Contract extends BaseModel {
  constructor(data) {
    super(data);
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

  get address() {
    return this.data['address'];
  }

  set address(addr) {
    check(ethers.utils.isAddress(addr), `addr ${addr} is invalid address`);
    this.data['address'] = addr;
  }

  get assetSymbol() {
    return this.data['assetSymbol'];
  }

  set assetSymbol(symbol) {
    check(typeof symbol === 'string', 'symbol should be a string type');
    this.data['assetSymbol'] = symbol;
  }

  get assetType() {
    return this.data['assetType'];
  }

  set assetType(type) {
    check(isValidAssetType(type), `type ${type} is invalid AssetType`);
    this.data['assetType'] = type;
  }

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

  get bridgeType() {
    return this.data['bridgeType'];
  }

  set bridgeType(type) {
    check(isValidBridgeType(type), `type ${type} is invalid BridgeType`);
    this.data['bridgeType'] = type;
  }

  get peerChainId() {
    return this.data['peerChainId'];
  }

  set peerChainId(id) {
    check(!id || typeof id === 'number', 'id should be a number type');
    this.data['peerChainId'] = id;
  }

  get peerContractAddress() {
    return this.data['peerContractAddress'];
  }

  set peerContractAddress(addr) {
    check(!addr || ethers.utils.isAddress(addr), `addr ${addr} is invalid address`);
    this.data['peerContractAddress'] = addr;
  }

  get circuits() {
    return this.data['circuits'];
  }

  set circuits(scheme) {
    check(typeof scheme === 'string', 'scheme should a string type');
    this.data['circuits'] = scheme;
  }

  get syncedBlock() {
    return this.data['syncedBlock'];
  }

  set syncedBlock(blockNumber) {
    check(typeof blockNumber === 'number', 'blockNumber should a number type');
    this.data['syncedBlock'] = blockNumber;
  }
}
