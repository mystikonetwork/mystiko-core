import { Transport } from '@connectrpc/connect';
import { MystikoConfig } from '@mystikonetwork/config';
import { RelayerConfig } from '@mystikonetwork/gas-relayer-config';
import * as sequencer from '@mystikonetwork/sequencer-client';
import { initDatabase, MystikoDatabase } from '@mystikonetwork/database';
import { MetaMaskSigner, PrivateKeySigner, ProviderPool, ProviderPoolImpl } from '@mystikonetwork/ethers';
import {
  IRelayerHandler as GasRelayers,
  Relayer as GasRelayerClient,
} from '@mystikonetwork/gas-relayer-client';
import { IScreeningClient, v1 as Screening } from '@mystikonetwork/screening-client';
import { MystikoProtocol, ProtocolFactory, ProtocolFactoryV2 } from '@mystikonetwork/protocol';
import {
  detectCountryCode,
  initLogger,
  logger,
  ProviderConnection,
  ProviderFactory,
} from '@mystikonetwork/utils';
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

import defaultMainnetConfig from './config/mystiko_config/config/mainnet/config.json';
import defaultTestnetConfig from './config/mystiko_config/config/testnet/config.json';
import defaultRelayerMainnetConfig from './config/mystiko_relayer_config/config/mainnet/config.json';
import defaultRelayerTestnetConfig from './config/mystiko_relayer_config/config/testnet/config.json';

export const DEFAULT_IP_PRO_API = 'https://ipwhois.pro';

export type GrpcTransportFactory = (baseUrl: string) => Transport;

export interface InitOptions {
  isTestnet?: boolean;
  isStaging?: boolean;
  configGitRevision?: string;
  configBaseUrl?: string;
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
  grpcTransportFactory?: GrpcTransportFactory;
  gasRelayers?: GasRelayers;
  screening?: IScreeningClient;
  ipWhoisApiKey?: string;
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

  private countryCode?: string;

  private ipWhoisApiUrl?: string;

  public async initialize(options?: InitOptions) {
    const {
      isTestnet = true,
      isStaging = false,
      configGitRevision,
      configBaseUrl,
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
      grpcTransportFactory,
      gasRelayers,
      screening,
      ipWhoisApiKey,
    } = options || {};
    this.db = await initDatabase(dbParams);
    initLogger(loggingOptions);
    logger.setLevel(loggingLevel);
    this.logger = logger;
    if (typeof conf === 'string') {
      this.config = await MystikoConfig.createFromFile(conf);
    } else {
      this.config = conf;
    }
    if (!this.config) {
      const configRemoteOptions = {
        isTestnet,
        isStaging,
        gitRevision: configGitRevision,
        baseUrl: configBaseUrl,
      };
      this.config = await MystikoConfig.createFromRemote(configRemoteOptions).catch((error) => {
        this.logger?.warn(`failed to fetch latest config from remote: ${error}`);
        return isTestnet
          ? MystikoConfig.createFromPlain(defaultTestnetConfig)
          : MystikoConfig.createFromPlain(defaultMainnetConfig);
      });
    }
    const protocols = protocolFactory || new ProtocolFactoryV2(await this.zkProverFactory());
    this.protocol = await protocols.create();
    const contexts = contextFactory || new DefaultContextFactory(this.config, this.db, this.protocol);
    this.context = contexts.createContext();
    let sequencerClient: sequencer.v1.SequencerClient | undefined;
    const sequencerConfig = this.config.sequencer;
    if (grpcTransportFactory && sequencerConfig) {
      const schema = sequencerConfig.isSsl ? 'https' : 'http';
      const port = sequencerConfig.port !== undefined ? `:${sequencerConfig.port}` : '';
      const baseUrl = `${schema}://${sequencerConfig.host}${port}`;
      const transport = grpcTransportFactory(baseUrl);
      sequencerClient = new sequencer.v1.SequencerClient(transport);
    }
    this.context.executors = executorFactory || new ExecutorFactoryV2(this.context, sequencerClient);
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
    await this.accounts.init();
    if (gasRelayers) {
      this.context.gasRelayers = gasRelayers;
    } else {
      const gasRelayerClient = new GasRelayerClient();
      const gasRelayerConfig = await RelayerConfig.createFromRemote({
        isTestnet,
        isStaging,
      }).catch((error) => {
        this.logger?.warn(`failed to fetch latest gas relayer config from remote: ${error}`);
        return isTestnet
          ? RelayerConfig.createFromPlain(defaultRelayerTestnetConfig)
          : RelayerConfig.createFromPlain(defaultRelayerMainnetConfig);
      });
      await gasRelayerClient.initialize({
        isTestnet,
        mystikoConfig: this.config,
        relayerConfig: gasRelayerConfig,
        logger: logger.getLogger('gas-relayer-client'),
        providers: this.providers,
      });
      if (gasRelayerClient.relayerHandler) {
        this.context.gasRelayers = gasRelayerClient.relayerHandler;
      }
    }
    if (screening) {
      this.context.screening = screening;
    } else {
      const screeningClientV1 = new Screening.ScreeningClientV1({
        apiUrl: this.config.screening.url,
        timeout: this.config.screening.clientTimeoutMs,
      });
      this.context.screening = screeningClientV1;
    }
    if (ipWhoisApiKey && ipWhoisApiKey.length > 0) {
      this.ipWhoisApiUrl = `${DEFAULT_IP_PRO_API}/?key=${ipWhoisApiKey}`;
    }
    this.logger.info('mystiko has been successfully initialized, enjoy!');
  }

  public async isBlacklisted(): Promise<boolean> {
    const countryBlacklist = this.config?.countryBlacklist.map((c) => c.toUpperCase()) || [];
    if (countryBlacklist.length === 0) {
      return Promise.resolve(false);
    }
    if (!this.countryCode) {
      this.countryCode = await detectCountryCode(this.ipWhoisApiUrl).catch((e) => {
        this.logger?.warn('Failed to detect country code', e);
        return undefined;
      });
    }
    return !!this.countryCode && countryBlacklist.includes(this.countryCode.toUpperCase());
  }

  protected getChainConfig(chainId: number): Promise<ProviderConnection[]> {
    if (this.chains) {
      return this.chains.findOne(chainId).then((chain) => {
        if (chain) {
          return chain.providers.map((p) => ({
            url: p.url,
            timeout: p.timeoutMs,
            maxTryCount: p.maxTryCount,
            quorumWeight: p.quorumWeight,
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
