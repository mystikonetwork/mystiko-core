import { MystikoConfig, ProviderType } from '@mystikonetwork/config';
import {
  DefaultProviderFactory,
  ProviderConnection,
  ProviderFactory,
  QuorumProviderFactory,
} from '@mystikonetwork/utils';
import { ethers } from 'ethers';

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

  private providerFactory?: ProviderFactory;

  private readonly pool: Map<number, EtherProvider>;

  constructor(
    config: MystikoConfig,
    providerConfigGetter?: ProviderConfigGetter,
    providerFactory?: ProviderFactory,
  ) {
    this.config = config;
    this.providerConfigGetter = providerConfigGetter;
    this.providerFactory = providerFactory;
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
    const chainConfig = this.config.getChainConfig(chainId);
    if (chainConfig) {
      const providerFactory =
        this.providerFactory ||
        (chainConfig.providerType === ProviderType.FAILOVER
          ? new DefaultProviderFactory()
          : new QuorumProviderFactory());
      if (this.providerConfigGetter) {
        return this.providerConfigGetter(chainId).then((connections) => {
          if (connections.length === 0) {
            return undefined;
          }
          const newProvider = providerFactory.createProvider(connections, {
            quorumPercentage: chainConfig.providerQuorumPercentage,
          });
          this.pool.set(chainId, newProvider);
          return newProvider;
        });
      }
      const newProvider = providerFactory.createProvider(
        chainConfig.providers.map((p) => ({
          url: p.url,
          timeout: p.timeoutMs,
          maxTryCount: p.maxTryCount,
          quorumWeight: p.quorumWeight,
        })),
        { quorumPercentage: chainConfig.providerQuorumPercentage },
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
