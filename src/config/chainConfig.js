import { ethers } from 'ethers';
import { BaseConfig } from './common.js';
import { ContractConfig, BridgeType } from './contractConfig.js';
import { check } from '../utils.js';

export class ChainConfig extends BaseConfig {
  constructor(rawConfig) {
    super(rawConfig);
    BaseConfig.checkNumber(this.config, 'chainId');
    BaseConfig.checkString(this.config, 'name');
    BaseConfig.checkStringArray(this.config, 'providers');
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
