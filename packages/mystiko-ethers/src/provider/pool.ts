import { ethers } from 'ethers';
import { MystikoConfig } from '@mystikonetwork/config';
import { DefaultProviderFactory, ProviderConnection, ProviderFactory } from '@mystikonetwork/utils';

type EtherProvider = ethers.providers.Provider;
type ProviderConfigGetter = (chain: number) => Promise<ProviderConnection[]>;

export interface ProviderPool {
  hasProvider(chainId: number): boolean;
  clearProvider(chainId: number): void;
  checkProvider(chainId: number): Promise<EtherProvider>;
  getProvider(chainId: number): Promise<EtherProvider | undefined>;
  setProvider(chainId: number, provider: EtherProvider): void;
  setProviderFactory(factory: ProviderFactory): void;
}

export class ProviderPoolImpl implements ProviderPool {
  private readonly config: MystikoConfig;

  private readonly providerConfigGetter?: ProviderConfigGetter;

  private providerFactory: ProviderFactory;

  private readonly pool: Map<number, EtherProvider>;

  constructor(
    config: MystikoConfig,
    providerConfigGetter?: ProviderConfigGetter,
    providerFactory?: ProviderFactory,
  ) {
    this.config = config;
    this.providerConfigGetter = providerConfigGetter;
    this.providerFactory = providerFactory || new DefaultProviderFactory();
    this.pool = new Map<number, ethers.providers.Provider>();
  }

  public clearProvider(chainId: number) {
    if (this.pool.has(chainId)) {
      this.pool.delete(chainId);
    }
  }

  public checkProvider(chainId: number): Promise<EtherProvider> {
    return this.getProvider(chainId).then((provider) => {
      if (!provider) {
        return Promise.reject(new Error(`cannot get provider for chainId=${chainId}`));
      }
      return provider;
    });
  }

  public getProvider(chainId: number): Promise<EtherProvider | undefined> {
    const provider = this.pool.get(chainId);
    if (provider) {
      return Promise.resolve(provider);
    }
    if (this.providerConfigGetter) {
      return this.providerConfigGetter(chainId).then((connections) => {
        if (connections.length === 0) {
          return undefined;
        }
        const newProvider = this.providerFactory.createProvider(connections);
        this.pool.set(chainId, newProvider);
        return newProvider;
      });
    }
    const chainConfig = this.config.getChainConfig(chainId);
    if (chainConfig) {
      const newProvider = this.providerFactory.createProvider(
        chainConfig.providers.map((p) => ({
          url: p.url,
          timeout: p.timeoutMs,
          maxTryCount: p.maxTryCount,
        })),
      );
      this.pool.set(chainId, newProvider);
      return Promise.resolve(newProvider);
    }
    return Promise.resolve(undefined);
  }

  public hasProvider(chainId: number): boolean {
    return this.pool.has(chainId);
  }

  public setProvider(chainId: number, provider: EtherProvider): void {
    this.pool.set(chainId, provider);
  }

  public setProviderFactory(factory: ProviderFactory): void {
    this.providerFactory = factory;
  }
}
