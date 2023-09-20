import * as utils from '@mystikonetwork/utils';
import { LoglevelPluginPrefixOptions } from 'loglevel-plugin-prefix';
import { Logger, LogLevelDesc } from 'loglevel';
import { ProviderPool, ProviderPoolImpl } from '@mystikonetwork/ethers';
import { MystikoConfig } from '@mystikonetwork/config';
import { RelayerConfig } from '@mystikonetwork/gas-relayer-config';
import { defaultRelayerConfig } from './config';
import { IHandlerFactory, IRelayerHandler } from './interface';
import { HandlerFactory } from './handler';

export interface InitOptions {
  isTestnet?: boolean;
  relayerConfig?: string | RelayerConfig;
  mystikoConfig?: string | MystikoConfig;
  loggingLevel?: LogLevelDesc;
  loggingOptions?: LoglevelPluginPrefixOptions;
  handlerFactory?: IHandlerFactory;
  defaultTimeoutMs?: number;
  defaultIntervalMs?: number;
  providers?: ProviderPool;
  logger?: Logger;
}

export class Relayer {
  private relayerConfig?: RelayerConfig;

  private mystikoConfig?: MystikoConfig;

  public logger?: Logger;

  private providers?: ProviderPool;

  public relayerHandler?: IRelayerHandler;

  public async initialize(options?: InitOptions) {
    const {
      isTestnet = true,
      relayerConfig,
      mystikoConfig,
      loggingOptions = undefined,
      loggingLevel = 'warn',
      handlerFactory,
      defaultTimeoutMs = 60000,
      defaultIntervalMs = 500,
      logger,
      providers,
    } = options || {};

    if (typeof relayerConfig === 'string') {
      this.relayerConfig = await RelayerConfig.createFromFile(relayerConfig);
    } else {
      this.relayerConfig = relayerConfig;
    }
    if (!this.relayerConfig) {
      this.relayerConfig = await defaultRelayerConfig(isTestnet);
    }

    if (typeof mystikoConfig === 'string') {
      this.mystikoConfig = await MystikoConfig.createFromFile(mystikoConfig);
    } else {
      this.mystikoConfig = mystikoConfig;
    }
    if (!this.mystikoConfig) {
      this.mystikoConfig = isTestnet
        ? await MystikoConfig.createDefaultTestnetConfig()
        : await MystikoConfig.createDefaultMainnetConfig();
    }

    if (providers) {
      this.providers = providers;
    } else {
      this.providers = new ProviderPoolImpl(this.mystikoConfig);
    }

    const handlers = handlerFactory || new HandlerFactory(this.providers, this.relayerConfig, defaultTimeoutMs, defaultIntervalMs);
    this.relayerHandler = handlers.createRelayerHandler();

    if (logger) {
      this.logger = logger;
    } else {
      utils.initLogger(loggingOptions);
      utils.logger.setLevel(loggingLevel);
      this.logger = utils.logger;
    }

    this.logger.info('@mystikonetwork/gas-relayer-client has been successfully initialized, enjoy!');
  }
}
