import { MystikoConfig } from '@mystikonetwork/config';
import { initDatabase, MystikoDatabase } from '@mystikonetwork/database';
import { MetaMaskSigner, PrivateKeySigner, ProviderPool, ProviderPoolImpl } from '@mystikonetwork/ethers';
import {
  IRelayerHandler as GasRelayers,
  Relayer as GasRelayerClient,
} from '@mystikonetwork/gas-relayer-client';
import { MystikoProtocol, ProtocolFactory, ProtocolFactoryV2 } from '@mystikonetwork/protocol';
import { initLogger, logger, ProviderConnection, ProviderFactory } from '@mystikonetwork/utils';
import { ZKProverFactory } from '@mystikonetwork/zkp';
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
  NullifierHandler,
  Synchronizer,
  SynchronizerFactory,
  TransactionHandler,
  WalletHandler,
} from './interface';
import { SynchronizerFactoryV2 } from './synchronizer';

export interface InitOptions {
  isTestnet?: boolean;
  conf?: string | MystikoConfig;
  dbParams?: RxDatabaseCreator;
  loggingLevel?: LogLevelDesc;
  loggingOptions?: LoglevelPluginPrefixOptions;
  contextFactory?: ContextFactory;
  providerFactory?: ProviderFactory;
  handlerFactory?: HandlerFactory;
  executorFactory?: ExecutorFactory;
  synchronizerFactory?: SynchronizerFactory;
  protocolFactory?: ProtocolFactory;
  gasRelayers?: GasRelayers;
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

  public nullifiers?: NullifierHandler;

  public deposits?: DepositHandler;

  public transactions?: TransactionHandler;

  public signers?: { metaMask: MetaMaskSigner; privateKey: PrivateKeySigner };

  public providers?: ProviderPool;

  public protocol?: MystikoProtocol;

  public synchronizer?: Synchronizer;

  private context?: MystikoContextInterface;

  public async initialize(options?: InitOptions) {
    const {
      isTestnet = true,
      conf,
      dbParams,
      loggingLevel = 'warn',
      loggingOptions,
      contextFactory,
      providerFactory,
      handlerFactory,
      executorFactory,
      synchronizerFactory,
      protocolFactory,
      gasRelayers,
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
    logger.setLevel(loggingLevel);
    this.logger = logger;
    const protocols = protocolFactory || new ProtocolFactoryV2(await this.zkProverFactory());
    this.protocol = await protocols.create();
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
    this.nullifiers = handlers.createNullifierHandler();
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
    const syncFactory = synchronizerFactory || new SynchronizerFactoryV2(this.context);
    this.synchronizer = syncFactory.createSynchronizer();
    await this.chains.init();
    await this.contracts.init();
    if (gasRelayers) {
      this.context.gasRelayers = gasRelayers;
    } else {
      const gasRelayerClient = new GasRelayerClient();
      await gasRelayerClient.initialize({
        isTestnet,
        mystikoConfig: this.config,
        logger: logger.getLogger('gas-relayer-client'),
        providers: this.providers,
      });
      if (gasRelayerClient.relayerHandler) {
        this.context.gasRelayers = gasRelayerClient.relayerHandler;
      }
    }
    this.logger.info('mystiko has been successfully initialized, enjoy!');
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

  protected abstract zkProverFactory(): Promise<ZKProverFactory>;
}
