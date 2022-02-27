import { ethers } from 'ethers';
import { MystikoConfig } from '@mystiko/config';

/**
 * @class ProviderPool
 * @desc a pool of JSON-RPC providers for different blockchains.
 * @param {MystikoConfig} conf full configuration object of {@link MystikoConfig}.
 */
export class ProviderPool {
  private readonly config: MystikoConfig;

  private readonly providers: { [key: number]: ethers.providers.Provider };

  constructor(conf: MystikoConfig) {
    this.config = conf;
    this.providers = {};
  }

  /**
   * @desc setting up provider pool with given provider generator.
   * If providerGenerator is not given, it will generate ethers.providers.JsonRpcProvider
   * wrapped with ethers.providers.FallbackProvider to offer better availability.
   * @param {Function} [providerGenerator] a function to generate JSON-RPC provider.
   */
  connect(providerGenerator?: (rpcEndpoints: string[]) => ethers.providers.Provider) {
    let pGenerator: (rpcEndpoints: string[]) => ethers.providers.Provider;
    if (!providerGenerator) {
      pGenerator = (rpcEndpoints) => {
        const jsonRpcProviders = rpcEndpoints.map(
          (rpcEndpoint) => new ethers.providers.JsonRpcProvider(rpcEndpoint),
        );
        return new ethers.providers.FallbackProvider(jsonRpcProviders, 1);
      };
    } else {
      pGenerator = providerGenerator;
    }
    this.config.chains.forEach((chain) => {
      this.providers[chain.chainId] = pGenerator(chain.providers);
    });
  }

  /**
   * @desc return the configured JSON-RPC provider for the given chain id.
   * @param {number} chainId the requested blockchain chain id.
   * @returns {ethers.providers.Provider | undefined} a provider instance for querying the blockchain data.
   * @throws {Error} if no provider was settled for the specified chain.
   */
  public getProvider(chainId: number): ethers.providers.Provider | undefined {
    return this.providers[chainId];
  }
}
