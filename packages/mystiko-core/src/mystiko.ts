import { MystikoConfig } from '@mystikonetwork/config';
import { initDatabase, MystikoDatabase } from '@mystikonetwork/database';
import { MetaMaskSigner, PrivateKeySigner, ProviderPool, ProviderPoolImpl } from '@mystikonetwork/ethers';
import { MystikoProtocol, MystikoProtocolV2, ZokratesRuntime } from '@mystikonetwork/protocol';
import { initLogger, logger, ProviderConnection, ProviderFactory } from '@mystikonetwork/utils';
import { Logger, LogLevelDesc } from 'loglevel';
import { LoglevelPluginPrefixOptions } from 'loglevel-plugin-prefix';
import { RxDatabaseCreator } from 'rxdb';
import { DefaultContextFactory } from './context';
import { ExecutorFactoryV2 } from './executor';
import { HandlerFactoryV2 } from './handler';
import {
  AccountHandler,
  AssetHandler,
  ChainHandler,
  CommitmentHandler,
  ContextFactory,
  ContractHandler,
  DepositHandler,
  ExecutorFactory,
  HandlerFactory,
  MystikoContextInterface,
  TransactionHandler,
  WalletHandler,
} from './interface';

export interface InitOptions {
  isTestnet?: boolean;
  conf?: string | MystikoConfig;
  dbParams?: RxDatabaseCreator;
  loggingLevel?: LogLevelDesc;
  loggingOptions?: LoglevelPluginPrefixOptions;
  protocol?: MystikoProtocol;
  contextFactory?: ContextFactory;
  providerFactory?: ProviderFactory;
  handlerFactory?: HandlerFactory;
  executorFactory?: ExecutorFactory;
}

export abstract class Mystiko {
  public config?: MystikoConfig;

  public logger?: Logger;

  public db?: MystikoDatabase;

  public chains?: ChainHandler;

  public contracts?: ContractHandler;

  public wallets?: WalletHandler;

  public accounts?: AccountHandler;

  public assets?: AssetHandler;

  public commitments?: CommitmentHandler;

  public deposits?: DepositHandler;

  public transactions?: TransactionHandler;

  public signers?: { metaMask: MetaMaskSigner; privateKey: PrivateKeySigner };

  public providers?: ProviderPool;

  public protocol?: MystikoProtocol;

  private context?: MystikoContextInterface;

  public async initialize(options?: InitOptions) {
    const {
      isTestnet = true,
      conf,
      dbParams,
      loggingLevel = 'warn',
      loggingOptions,
      protocol,
      contextFactory,
      providerFactory,
      handlerFactory,
      executorFactory,
    } = options || {};
    if (typeof conf === 'string') {
      this.config = await MystikoConfig.createFromFile(conf);
    } else {
      this.config = conf;
    }
    if (!this.config) {
      this.config = await (isTestnet
        ? MystikoConfig.createDefaultTestnetConfig()
        : MystikoConfig.createDefaultMainnetConfig());
    }
    this.db = await initDatabase(dbParams);
    initLogger(loggingOptions);
    this.logger = logger;
    this.logger.setLevel(loggingLevel);
    this.protocol = protocol || new MystikoProtocolV2(await this.zokratesRuntime());
    const contexts = contextFactory || new DefaultContextFactory(this.config, this.db, this.protocol);
    this.context = contexts.createContext();
    this.context.executors = executorFactory || new ExecutorFactoryV2(this.context);
    const handlers = handlerFactory || new HandlerFactoryV2(this.context);
    this.chains = handlers.createChainHandler();
    this.contracts = handlers.createContractHandler();
    this.wallets = handlers.createWalletHandler();
    this.accounts = handlers.createAccountHandler();
    this.assets = handlers.createAssetHandler();
    this.commitments = handlers.createCommitmentHandler();
    this.deposits = handlers.createDepositHandler();
    this.transactions = handlers.createTransactionHandler();
    this.providers = new ProviderPoolImpl(
      this.config,
      (chainId) => this.getChainConfig(chainId),
      providerFactory,
    );
    this.context.providers = this.providers;
    this.signers = {
      metaMask: new MetaMaskSigner(this.config),
      privateKey: new PrivateKeySigner(this.config, this.providers),
    };
    await this.chains.init();
    await this.contracts.init();
    this.logger.info('@mystikonetwork/core has been successfully initialized, enjoy!');
  }

  protected getChainConfig(chainId: number): Promise<ProviderConnection[]> {
    if (this.chains) {
      return this.chains.findOne(chainId).then((chain) => {
        if (chain) {
          return chain.providers.map((p) => ({
            url: p.url,
            timeout: p.timeoutMs,
            maxTryCount: p.maxTryCount,
          }));
        }
        /* istanbul ignore next */
        return [];
      });
    }
    /* istanbul ignore next */
    return Promise.resolve([]);
  }

  protected abstract zokratesRuntime(): Promise<ZokratesRuntime>;
}
