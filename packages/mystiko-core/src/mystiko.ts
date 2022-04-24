import { MystikoConfig } from '@mystikonetwork/config';
import { initDatabase, MystikoDatabase } from '@mystikonetwork/database';
import { MetaMaskSigner, PrivateKeySigner, ProviderPool, ProviderPoolImpl } from '@mystikonetwork/ethers';
import { MystikoProtocol, MystikoProtocolV2, ZokratesRuntime } from '@mystikonetwork/protocol';
import { initLogger, logger, ProviderFactory } from '@mystikonetwork/utils';
import { Logger, LogLevelDesc } from 'loglevel';
import { LoglevelPluginPrefixOptions } from 'loglevel-plugin-prefix';
import { RxDatabaseCreator } from 'rxdb';
import { MystikoContext } from './context';
import { DefaultExecutorFactory } from './executor';
import {
  AccountHandlerV2,
  AssetHandlerV2,
  CommitmentHandlerV2,
  DepositHandlerV2,
  TransactionHandlerV2,
  WalletHandlerV2,
} from './handler';
import {
  AccountHandler,
  AssetHandler,
  CommitmentHandler,
  DepositHandler,
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
  providerFactory?: ProviderFactory;
  tracingEndpoint?: string;
  tracingVersion?: string;
  tracingSampleRate?: number;
}

export abstract class Mystiko {
  public config?: MystikoConfig;

  public logger?: Logger;

  public db?: MystikoDatabase;

  public wallets?: WalletHandler;

  public accounts?: AccountHandler;

  public assets?: AssetHandler;

  public commitments?: CommitmentHandler;

  public deposits?: DepositHandler;

  public transactions?: TransactionHandler;

  public signers?: { metaMask: MetaMaskSigner; privateKey: PrivateKeySigner };

  private providerPool?: ProviderPool;

  private protocol?: MystikoProtocol;

  private context?: MystikoContextInterface;

  public async initialize(options?: InitOptions) {
    const {
      isTestnet = true,
      conf,
      dbParams,
      loggingLevel = 'warn',
      loggingOptions,
      providerFactory,
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
    this.providerPool = new ProviderPoolImpl(this.config, providerFactory);
    this.providerPool.connect();
    this.protocol = new MystikoProtocolV2(await this.zokratesRuntime());
    this.context = new MystikoContext(this.config, this.db, this.protocol);
    const executors = new DefaultExecutorFactory();;
    executors.context = this.context;
    this.context.providers = this.providerPool;
    this.context.executors = executors;
    this.wallets = new WalletHandlerV2(this.context);
    this.accounts = new AccountHandlerV2(this.context);
    this.assets = new AssetHandlerV2(this.context);
    this.commitments = new CommitmentHandlerV2(this.context);
    this.deposits = new DepositHandlerV2(this.context);
    this.transactions = new TransactionHandlerV2(this.context);
    this.signers = {
      metaMask: new MetaMaskSigner(this.config),
      privateKey: new PrivateKeySigner(this.config, this.providerPool),
    };
    this.logger.info('@mystikonetwork/client has been successfully initialized, enjoy!');
  }

  protected abstract zokratesRuntime(): Promise<ZokratesRuntime>;
}
