import { ethers } from 'ethers';
import { MystikoConfig } from '../config/mystikoConfig.js';
import { check } from '../utils.js';

export class ProviderPool {
  constructor(conf) {
    check(conf instanceof MystikoConfig, 'conf should be MystikoConfig instance');
    this.config = conf;
    this.providers = {};
  }

  connect(providerGenerator = undefined) {
    if (!providerGenerator) {
      providerGenerator = (rpcEndpoints) => {
        const jsonRpcProviders = rpcEndpoints.map((rpcEndpoint) => {
          return new ethers.providers.JsonRpcProvider(rpcEndpoint);
        });
        return new ethers.providers.FallbackProvider(jsonRpcProviders);
      };
    }
    this.config.chains.forEach((chain) => {
      this.providers[chain.chainId] = providerGenerator(chain.providers);
    });
  }

  getProvider(chainId) {
    check(typeof chainId === 'number', 'chainId should be a number');
    const provider = this.providers[chainId];
    check(provider, `provider does not exist for chain ${chainId}`);
    return provider;
  }
}
