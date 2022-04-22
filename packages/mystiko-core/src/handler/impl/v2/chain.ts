import { isURL } from 'class-validator';
import { Chain, DatabaseQuery } from '@mystikonetwork/database';
import { MystikoHandler } from '../../handler';
import { ChainHandler, ChainOptions, MystikoContextInterface } from '../../../interface';
import { createErrorPromise, MystikoErrorCode } from '../../../error';

export class ChainHandlerV2 extends MystikoHandler implements ChainHandler {
  constructor(context: MystikoContextInterface) {
    super(context);
    this.context.chains = this;
  }

  public find(query?: DatabaseQuery<Chain>): Promise<Chain[]> {
    return this.context.wallets.checkCurrent().then((wallet) => {
      const selector: any = query?.selector || {};
      selector.wallet = wallet.id;
      const newQuery = query ? { ...query, selector } : { selector };
      return this.db.chains.find(newQuery).exec();
    });
  }

  public findOne(chainId: number): Promise<Chain | null> {
    return this.context.wallets
      .checkCurrent()
      .then((wallet) => this.db.chains.findOne({ selector: { wallet: wallet.id, chainId } }).exec());
  }

  public init(): Promise<Chain[]> {
    return this.context.wallets.checkCurrent().then((wallet) => {
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
              providers: chainConfig.providers.map((p) => p.url),
              eventFilterSize: chainConfig.eventFilterSize,
              wallet: wallet.id,
            });
          }
          return existingChain.atomicUpdate((data) => {
            data.eventFilterSize = chainConfig.eventFilterSize;
            data.updatedAt = now;
            return data;
          });
        }),
      );
      return Promise.all(chainPromises);
    });
  }

  public update(chainId: number, options: ChainOptions): Promise<Chain | null> {
    if (options.providers) {
      for (let i = 0; i < options.providers.length; i += 1) {
        if (!isURL(options.providers[i], { protocols: ['http', 'https', 'ws', 'wss'], require_tld: false })) {
          return createErrorPromise(
            `invalid provider url ${options.providers[i]}`,
            MystikoErrorCode.INVALID_PROVIDER_URL,
          );
        }
      }
    }
    return this.findOne(chainId).then((chain) => {
      if (!chain) {
        return createErrorPromise(
          `cannot find chain id=${chainId} in database`,
          MystikoErrorCode.NON_EXISTING_CHAIN,
        );
      }
      return chain.atomicUpdate((data) => {
        let hasUpdate = false;
        if (options.name && options.name.length > 0) {
          hasUpdate = true;
          data.name = options.name;
        }
        if (options.providers && options.providers.length > 0) {
          hasUpdate = true;
          data.providers = options.providers;
        }
        if (hasUpdate) {
          data.updatedAt = MystikoHandler.now();
        }
        return data;
      });
    });
  }
}
