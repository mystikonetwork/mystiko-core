import { ethers } from 'ethers';
import { BaseConfig } from './common.js';
import { ContractConfig } from './contractConfig.js';
import { check, toHex } from '@mystiko/utils';
import { BridgeType } from '../model';

export const EXPLORER_TX_PLACEHOLDER = '%tx%';
export const EXPLORER_DEFAULT_PREFIX = `/tx/${EXPLORER_TX_PLACEHOLDER}`;

/**
 * @class ChainConfig
 * @extends BaseConfig
 * @param {Object} rawConfig raw configuration object.
 * @desc configuration class for blockchain network.
 */
export class ChainConfig extends BaseConfig {
  constructor(rawConfig) {
    super(rawConfig);
    BaseConfig.checkNumber(this.config, 'chainId');
    BaseConfig.checkString(this.config, 'name');
    BaseConfig.checkString(this.config, 'assetSymbol');
    BaseConfig.checkNumber(this.config, 'assetDecimals', false);
    BaseConfig.checkString(this.config, 'explorerUrl');
    BaseConfig.checkString(this.config, 'explorerPrefix', false);
    if (!this.explorerPrefix) {
      this.config['explorerPrefix'] = EXPLORER_DEFAULT_PREFIX;
    } else {
      check(this.explorerPrefix.indexOf(EXPLORER_TX_PLACEHOLDER) !== -1, 'not a valid prefix template');
    }
    BaseConfig.checkStringArray(this.config, 'providers');
    check(this.config['providers'].length > 0, 'providers cannot be empty');
    BaseConfig.checkObjectArray(this.config, 'contracts');
    this.contractByAddress = {};
    this.config['contracts'] = this.config['contracts'].map((contract) => {
      const contractConfig = new ContractConfig(contract);
      this.contractByAddress[contractConfig.address] = contractConfig;
      return contractConfig;
    });
  }

  /**
   * @property {number} chainId
   * @desc the chain id of this configured blockchain network.
   */
  get chainId() {
    return this.config['chainId'];
  }

  /**
   * @property {string} name
   * @desc the name of this configured blockchain network.
   */
  get name() {
    return this.config['name'];
  }

  /**
   * @property {string} assetSymbol
   * @desc the main asset symbol of this configured blockchain network.
   */
  get assetSymbol() {
    return this.config['assetSymbol'];
  }

  /**
   * @property {number} assetDecimals
   * @desc the main asset decimals of this configured blockchain network.
   */
  get assetDecimals() {
    return this.config['assetDecimals'] ? this.config['assetDecimals'] : 18;
  }

  /**
   * @property {string} explorerUrl
   * @desc the base explorer URL of this configured blockchain network.
   */
  get explorerUrl() {
    return this.config['explorerUrl'];
  }

  /**
   * @property {string} explorerPrefix
   * @desc the explorer's transaction URI template of this configured blockchain network.
   */
  get explorerPrefix() {
    return this.config['explorerPrefix'];
  }

  /**
   * @desc get full explorer URL with given transaction hash.
   * @param {string} txHash hash of the querying transaction.
   * @returns {string} full explorer URL.
   */
  getTxUrl(txHash) {
    check(typeof txHash === 'string', 'txHash should be a valid string');
    return `${this.explorerUrl}${this.explorerPrefix.replace(EXPLORER_TX_PLACEHOLDER, toHex(txHash))}`;
  }

  /**
   * @property {string[]} providers
   * @desc the array of this configured blockchain's JSON-RPC providers.
   */
  get providers() {
    return this.config['providers'];
  }

  /**
   * @property {ContractConfig[]} contracts
   * @desc the array of this configured blockchain's supported contract configurations.
   */
  get contracts() {
    return this.config['contracts'];
  }

  /**
   * @property {string[]} contractAddresses
   * @desc the array of this configured blockchain's supported contract addresses.
   */
  get contractAddresses() {
    return Object.keys(this.contractByAddress);
  }

  /**
   * @property {number[]} peerChainIds
   * @desc the array of this configured blockchain's supported peer chain ids.
   */
  get peerChainIds() {
    const chainIds = {};
    this.contractAddresses.forEach((address) => {
      const contract = this.getContract(address);
      if (contract.bridgeType === BridgeType.LOOP) {
        chainIds[this.chainId] = this.chainId;
      } else {
        chainIds[contract.peerChainId] = contract.peerChainId;
      }
    });
    return Object.values(chainIds);
  }

  /**
   * @desc get the array of supported asset symbols for the given peer chain id.
   * @param {number} peerChainId peer chain id
   * @returns {string[]} the array of asset symbols.
   */
  getAssetSymbols(peerChainId) {
    check(
      typeof peerChainId === 'number' || peerChainId instanceof Number,
      'peerChainId should be number or Number',
    );
    const symbols = {};
    this.contractAddresses.forEach((address) => {
      const contract = this.getContract(address);
      if (contract.bridgeType === BridgeType.LOOP && this.chainId === peerChainId) {
        symbols[contract.assetSymbol] = true;
      } else if (contract.peerChainId === peerChainId) {
        symbols[contract.assetSymbol] = true;
      }
    });
    return Object.keys(symbols);
  }

  /**
   * @desc get the contract configuration with the given address.
   * @param {string} address the address of contract.
   * @returns {ContractConfig} the contract config instance.
   */
  getContract(address) {
    check(ethers.utils.isAddress(address), address + ' is invalid address');
    return this.contractByAddress[address];
  }
}
