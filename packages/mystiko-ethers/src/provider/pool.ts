import { ethers } from 'ethers';
import { MystikoConfig } from '@mystikonetwork/config';
import { DefaultProviderFactory, ProviderFactory } from '@mystikonetwork/utils';

export interface ProviderPool {
  connect(): void;
  setProviderFactory(factory: ProviderFactory): void;
  getProvider(chainId: number): ethers.providers.Provider | undefined;
  setProvider(chainId: number, provider: ethers.providers.Provider): void;
}

export class ProviderPoolImpl implements ProviderPool {
  private readonly config: MystikoConfig;

  private providerFactory: ProviderFactory;

  private readonly pool: Map<number, ethers.providers.Provider>;

  constructor(config: MystikoConfig, providerFactory?: ProviderFactory) {
    this.config = config;
    this.providerFactory = providerFactory || new DefaultProviderFactory();
    this.pool = new Map<number, ethers.providers.Provider>();
  }

  public connect(): void {
    this.config.chains.forEach((chainConfig) => {
      const connections = chainConfig.providers.map((providerConfig) => ({
        url: providerConfig.url,
        timeout: providerConfig.timeoutMs,
        maxTryCount: providerConfig.maxTryCount,
      }));
      const provider = this.providerFactory.createProvider(connections);
      this.pool.set(chainConfig.chainId, provider);
    });
  }

  public getProvider(chainId: number): ethers.providers.Provider | undefined {
    return this.pool.get(chainId);
  }

  public setProvider(chainId: number, provider: ethers.providers.Provider): void {
    this.pool.set(chainId, provider);
  }

  public setProviderFactory(factory: ProviderFactory): void {
    this.providerFactory = factory;
  }
}
