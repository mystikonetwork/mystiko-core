import { ethers } from 'ethers';
import { MystikoConfig } from '@mystiko/config';
import { check } from '@mystiko/utils';

/**
 * @external external:JsonRpcProvider
 * @see {@link https://docs.ethers.io/v5/api/providers/jsonrpc-provider/ JsonRpcProvider}
 */
/**
 * @external external:FallbackProvider
 * @see {@link https://docs.ethers.io/v5/api/providers/jsonrpc-provider/ FallbackProvider}
 */
/**
 * @class ProviderPool
 * @desc a pool of JSON-RPC providers for different blockchains.
 * @param {MystikoConfig} conf full configuration object of {@link MystikoConfig}.
 */
export class ProviderPool {
  constructor(conf) {
    check(conf instanceof MystikoConfig, 'conf should be MystikoConfig instance');
    this.config = conf;
    this.providers = {};
  }

  /**
   * @desc setting up provider pool with given provider generator.
   * If providerGenerator is not given, it will generate {@link external:JsonRpcProvider}
   * wrapped with {@link external:FallbackProvider} to offer better availability.
   * @param {Function} [providerGenerator] a function to generate JSON-RPC provider.
   */
  connect(providerGenerator = undefined) {
    if (!providerGenerator) {
      providerGenerator = (rpcEndpoints) => {
        const jsonRpcProviders = rpcEndpoints.map((rpcEndpoint) => {
          return new ethers.providers.JsonRpcProvider(rpcEndpoint);
        });
        return new ethers.providers.FallbackProvider(jsonRpcProviders, 1);
      };
    }
    this.config.chains.forEach((chain) => {
      this.providers[chain.chainId] = providerGenerator(chain.providers);
    });
  }

  /**
   * @desc return the configured JSON-RPC provider for the given chain id.
   * @param {number} chainId the requested blockchain chain id.
   * @returns {external:Provider} a provider instance for querying the blockchain data.
   * @throws {Error} if no provider was settled for the specified chain.
   */
  getProvider(chainId) {
    check(typeof chainId === 'number', 'chainId should be a number');
    const provider = this.providers[chainId];
    check(provider, `provider does not exist for chain ${chainId}`);
    return provider;
  }
}
