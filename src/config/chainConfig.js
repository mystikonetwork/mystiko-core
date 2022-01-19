import { ethers } from 'ethers';
import { BaseConfig } from './common.js';
import { ContractConfig, BridgeType } from './contractConfig.js';
import { check } from '../utils.js';

export const EXPLORER_TX_PLACEHOLDER = '%tx%';
export const EXPLORER_DEFAULT_PREFIX = `/tx/${EXPLORER_TX_PLACEHOLDER}`;

export class ChainConfig extends BaseConfig {
  constructor(rawConfig) {
    super(rawConfig);
    BaseConfig.checkNumber(this.config, 'chainId');
    BaseConfig.checkString(this.config, 'name');
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

  get chainId() {
    return this.config['chainId'];
  }

  get name() {
    return this.config['name'];
  }

  get explorerUrl() {
    return this.config['explorerUrl'];
  }

  get explorerPrefix() {
    return this.config['explorerPrefix'];
  }

  getTxUrl(txHash) {
    check(typeof txHash === 'string', 'txHash should be a valid string');
    return `${this.explorerUrl}${this.explorerPrefix.replace(EXPLORER_TX_PLACEHOLDER, txHash)}`;
  }

  get providers() {
    return this.config['providers'];
  }

  get contracts() {
    return this.config['contracts'];
  }

  get contractAddresses() {
    return Object.keys(this.contractByAddress);
  }

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

  getContract(address) {
    check(ethers.utils.isAddress(address), address + ' is invalid address');
    return this.contractByAddress[address];
  }
}
