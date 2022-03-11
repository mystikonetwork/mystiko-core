import { ethers } from 'ethers';
import { MystikoConfig } from '@mystiko/config';
import { DefaultProviderFactory, ProviderFactory } from '@mystiko/utils';

/**
 * @class ProviderPool
 * @desc a pool of JSON-RPC providers for different blockchains.
 * @param {MystikoConfig} conf full configuration object of {@link MystikoConfig}.
 */
export class ProviderPool {
  private readonly config: MystikoConfig;

  private readonly providers: { [key: number]: ethers.providers.Provider };

  private providerFactory: ProviderFactory;

  constructor(conf: MystikoConfig, providerFactory?: ProviderFactory) {
    this.config = conf;
    this.providers = {};
    this.providerFactory = providerFactory || new DefaultProviderFactory();
  }

  /**
   * @desc setting up provider pool with given provider factory.
   */
  connect() {
    this.config.chains.forEach((chain) => {
      this.providers[chain.chainId] = this.providerFactory.createProvider(chain.providers);
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

  public setFactory(factory: ProviderFactory): void {
    this.providerFactory = factory;
  }
}
