import { ChainConfig } from '@mystikonetwork/config';
import { isURL } from 'class-validator';
import { Chain, DatabaseQuery, ProviderType } from '@mystikonetwork/database';
import { MystikoHandler } from '../../handler';
import { ChainHandler, ChainOptions, MystikoContextInterface, SyncedBlockNumber } from '../../../interface';
import { createErrorPromise, MystikoErrorCode } from '../../../error';

export class ChainHandlerV2 extends MystikoHandler implements ChainHandler {
  constructor(context: MystikoContextInterface) {
    super(context);
    this.context.chains = this;
  }

  public find(query?: DatabaseQuery<Chain>): Promise<Chain[]> {
    return this.db.chains.find(query).exec();
  }

  public findOne(chainId: number): Promise<Chain | null> {
    return this.db.chains.findOne({ selector: { chainId } }).exec();
  }

  public init(): Promise<Chain[]> {
    const chainPromises: Promise<Chain>[] = this.config.chains.map((chainConfig) =>
      this.findOne(chainConfig.chainId).then((existingChain) => {
        const now = MystikoHandler.now();
        if (!existingChain) {
          return this.db.chains.insert({
            id: MystikoHandler.generateId(),
            createdAt: now,
            updatedAt: now,
            chainId: chainConfig.chainId,
            name: chainConfig.name,
            providers: chainConfig.providers.map((p) => ({
              url: p.url,
              timeoutMs: p.timeoutMs,
              maxTryCount: p.maxTryCount,
              quorumWeight: p.quorumWeight,
            })),
            eventFilterSize: chainConfig.eventFilterSize,
            syncedBlockNumber: 0,
          });
        }
        return existingChain.atomicUpdate((data) => {
          data.eventFilterSize = chainConfig.eventFilterSize;
          data.updatedAt = now;
          if (!data.providerOverride) {
            data.providers = chainConfig.providers.map((p) => ({
              url: p.url,
              timeoutMs: p.timeoutMs,
              maxTryCount: p.maxTryCount,
              quorumWeight: p.quorumWeight,
            }));
          }
          if (!data.nameOverride) {
            data.name = chainConfig.name;
          }
          return data;
        });
      }),
    );
    return Promise.all(chainPromises);
  }

  public update(chainId: number, options: ChainOptions): Promise<Chain | null> {
    if (options.providers) {
      for (let i = 0; i < options.providers.length; i += 1) {
        const provider = options.providers[i];
        if (!isURL(provider.url, { protocols: ['http', 'https', 'ws', 'wss'], require_tld: false })) {
          return createErrorPromise(
            `invalid provider url ${provider.url}`,
            MystikoErrorCode.INVALID_PROVIDER_URL,
          );
        }
      }
    }
    return this.findOne(chainId).then((chain) => {
      if (chain) {
        const chainConfig = this.config.getChainConfig(chainId);
        return chain.atomicUpdate((data) => {
          let hasUpdate = false;
          if (options.name && options.name.length > 0 && options.name !== data.name) {
            hasUpdate = true;
            data.name = options.name;
            data.nameOverride = 1;
          }
          if (
            options.providers &&
            options.providers.length > 0 &&
            !ChainHandlerV2.isSameProviders(data.providers, options.providers)
          ) {
            hasUpdate = true;
            data.providers = ChainHandlerV2.wrapProviders(options.providers, data.providers, chainConfig);
            data.providerOverride = 1;
          }
          if (hasUpdate) {
            data.updatedAt = MystikoHandler.now();
          }
          return data;
        });
      }
      return null;
    });
  }

  public reset(chainId: number): Promise<Chain | null> {
    return this.findOne(chainId).then((chain) => {
      if (chain) {
        const chainConfig = this.config.getChainConfig(chainId);
        if (!chainConfig) {
          return chain;
        }
        return chain.atomicUpdate((data) => {
          data.name = chainConfig.name;
          data.providers = chainConfig.providers.map((p) => ({
            url: p.url,
            timeoutMs: p.timeoutMs,
            maxTryCount: p.maxTryCount,
            quorumWeight: p.quorumWeight,
          }));
          data.nameOverride = undefined;
          data.providerOverride = undefined;
          data.eventFilterSize = chainConfig.eventFilterSize;
          data.updatedAt = data.createdAt;
          return data;
        });
      }
      return null;
    });
  }

  public syncedBlockNumber(chainId: number, contractAddresses?: string[]): Promise<SyncedBlockNumber> {
    const chainConfig = this.config.getChainConfig(chainId);
    if (contractAddresses && contractAddresses.length === 0) {
      return Promise.resolve({ syncedBlockNumber: chainConfig?.startBlock, contracts: [] });
    }
    const query: DatabaseQuery<Chain> = contractAddresses
      ? { selector: { chainId, contractAddress: { $in: contractAddresses } } }
      : { selector: { chainId } };
    return this.context.contracts.find(query).then((contracts) => {
      const blockNumbers = contracts.map((contract) => contract.syncedBlockNumber);
      if (blockNumbers.length > 0) {
        return { syncedBlockNumber: Math.min(...blockNumbers), contracts };
      }

      return { syncedBlockNumber: chainConfig?.startBlock, contracts };
    });
  }

  public async resetSync(chainId: number | number[]): Promise<void> {
    const chainIds = typeof chainId === 'number' ? [chainId] : chainId;
    if (chainIds.length > 0) {
      const chains = await this.context.chains.find({
        selector: {
          chainId: { $in: chainIds },
        },
      });
      const contracts = await this.context.contracts.find({
        selector: {
          chainId: { $in: chainIds },
        },
      });
      const updatedChains = chains.map((chain) => {
        const updatingChain = chain.toMutableJSON();
        updatingChain.syncedAt = 0;
        updatingChain.updatedAt = MystikoHandler.now();
        return updatingChain;
      });
      const updatedContracts = contracts.map((contract) => {
        const updatingContract = contract.toMutableJSON();
        const config =
          this.config.getDepositContractConfigByAddress(contract.chainId, contract.contractAddress) ||
          this.config.getPoolContractConfigByAddress(contract.chainId, contract.contractAddress);
        if (config) {
          updatingContract.syncedBlockNumber = config.startBlock;
          updatingContract.updatedAt = MystikoHandler.now();
        }
        return updatingContract;
      });
      await this.context.db.chains.bulkUpsert(updatedChains);
      await this.context.db.contracts.bulkUpsert(updatedContracts);
      const commitments = await this.context.commitments.find({
        selector: {
          chainId: { $in: chainIds },
        },
      });
      await this.context.db.commitments.bulkRemove(commitments.map((c) => c.id));
      const nullifiers = await this.context.nullifiers.find({
        selector: {
          chainId: { $in: chainIds },
        },
      });
      await this.context.db.nullifiers.bulkRemove(nullifiers.map((n) => n.id));
    }
  }

  private static isSameProviders(providersA: ProviderType[], providersB: ProviderType[]): boolean {
    if (providersA.length === providersB.length) {
      for (let i = 0; i < providersA.length; i += 1) {
        const a = providersA[i];
        const b = providersB[i];
        if (a.url !== b.url) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  private static wrapProviders(
    providers: ProviderType[],
    previousProviders: ProviderType[],
    chainConfig?: ChainConfig,
  ): ProviderType[] {
    const wrapped: ProviderType[] = [];
    providers.forEach((provider) => {
      const previousProvider = previousProviders.find((another) => another.url === provider.url);
      const defaultProvider = chainConfig?.providers.find((another) => another.url === provider.url);
      wrapped.push({
        url: provider.url,
        timeoutMs: provider.timeoutMs || previousProvider?.timeoutMs || defaultProvider?.timeoutMs,
        maxTryCount: provider.maxTryCount || previousProvider?.maxTryCount || defaultProvider?.maxTryCount,
        quorumWeight:
          provider.quorumWeight || previousProvider?.quorumWeight || defaultProvider?.quorumWeight,
      });
    });
    return wrapped;
  }
}
