/**
 * MystikoJS
 * @author Fitch Li <fitch@this.network>
 *
 * Javascript library of this.Network's core protocol.
 */
import { Logger, LogLevelDesc } from 'loglevel';
import { LoglevelPluginPrefixOptions } from 'loglevel-plugin-prefix';
import {
  MystikoConfig,
  DefaultClientTestnetConfig,
  DefaultClientMainnetConfig,
  AssetType,
  BridgeType,
  readFromFile,
} from '@mystiko/config';
import * as utils from '@mystiko/utils';
import { createDatabase, exportDataAsString, importDataFromJson, importDataFromJsonFile } from './database';
import * as models from './model';
import { ProviderPool, ContractPool, MetaMaskSigner, PrivateKeySigner } from './chain';
import { FullSync } from './sync';
import {
  AccountHandler,
  ContractHandler,
  DepositHandler,
  EventHandler,
  NoteHandler,
  WalletHandler,
  WithdrawHandler,
} from './handler';
import { Contract } from './model';
import tracer, { MystikoTracer } from './tracing';
import { VERSION } from './version';

export interface InitOptions {
  isTestnet?: boolean;
  conf?: string | MystikoConfig;
  dbFile?: string;
  dbAdapter?: LokiPersistenceAdapter;
  syncInitIntervalMs?: number;
  syncIntervalMs?: number;
  loggingLevel?: LogLevelDesc;
  loggingOptions?: LoglevelPluginPrefixOptions;
}

/**
 * @module module:mystiko
 * @desc Core module of Mystiko's privacy preserving protocol.
 * Check {@link https://this.network/whitepaper.pdf Whitepaper} for more information.
 * @property {AccountHandler} accounts handler of Account related business logic
 * @property {MystikoConfig} config loaded configuration instance
 * @property {ContractPool} contractPool pool of wrapped smart contract instances.
 * @property {MystikoDatabase} db instance of wrapped database handlers.
 * @property {Object} db.adapter instance of the persistent database adapter.
 * @property {Function} db.exportDataAsString export data in database as a JSON string.
 * @property {Function} db.importDataFromJson import data into database from a JSON string.
 * @property {Function} db.importDataFromJsonFile import data into database from a JSON file.
 * @property {DepositHandler} deposits handler of Deposit related business logic.
 * @property {Object} ethers {@link https://docs.ethers.io/v5/ ethers.js} instance.
 * @property {module:mystiko/models} models a collection Mystiko data models and helper functions.
 * @property {NoteHandler} notes handler of PrivateNote related business logic.
 * @property {ProviderPool} providers pool of configured JSON-RPC providers for different blockchains.
 * @property {Object} signers object including supported transaction signers.
 * @property {MetaMaskSigner} signers.metaMask transaction signer with MetaMask.
 * @property {PrivateKeySigner} signers.privateKey transaction signer with private key.
 * @property {module:mystiko/utils} utils a collection of util functions.
 * @property {WalletHandler} wallets handler of Wallet related business logic.
 * @property {WithdrawHandler} withdraws handler of Withdraw related business logic.
 * @property {ContractHandler} contracts handler of Contract related business logic.
 * @property {EventHandler} events handler of Contract events related business logic.
 * @property {Object} pullers object including supported pullers.
 * @property {Logger} logger log handler for logging useful information.
 */
export class Mystiko {
  public models: any;

  public utils: any;

  public config?: MystikoConfig;

  public logger?: Logger;

  public db?: any;

  public wallets?: WalletHandler;

  public accounts?: AccountHandler;

  public providers?: ProviderPool;

  public contracts?: ContractHandler;

  public contractPool?: ContractPool;

  public notes?: NoteHandler;

  public deposits?: DepositHandler;

  public withdraws?: WithdrawHandler;

  public events?: EventHandler;

  public signers?: { metaMask: MetaMaskSigner; privateKey: PrivateKeySigner };

  public sync?: FullSync;

  public tracer: MystikoTracer;

  public readonly version: string;

  constructor() {
    this.models = { ...models, AssetType, BridgeType };
    this.utils = utils;
    this.tracer = tracer;
    this.version = VERSION;
  }

  /**
   * Initialize resources to make Mystiko wallet work.
   * Please call this function at the startup of your application.
   * @function module:this.initialize
   * @param {Object} [options={}] initialization options.
   * @param {boolean} [options.isTestnet=true] whether this application is running with Testnet environment.
   * @param {string|MystikoConfig} [options.conf] config object, it could be a string represents path
   *        of configuration file, or it could be an instance of MystikoConfig.
   * @param {string} [options.dbFile] name of the saved Loki database.
   * @param {Object} [options.dbAdapter] instance to persist data in your application.
   *        You could choose different adapter instance based on Lokijs's
   *        {@link https://techfort.github.io/LokiJS/ document}.
   * @param {boolean} [options.isStoreEvent=false] whether to store the pulled events from blockchains.
   * @param {number} [options.eventPullingIntervalMs=60000] how frequent to pull events from blockchain, this number is
   * in milliseconds.
   * @param {string} [options.loggingLevel='error'] the logging level of Mystiko's logger.
   * @param {string} [options.loggingOptions] the logging format options, please refer to
   * {@link https://github.com/kutuluk/loglevel-plugin-prefix loglevel-plugin-prefix}.
   * @returns {Promise<void>}
   */
  public async initialize(options?: InitOptions) {
    const {
      isTestnet = true,
      conf = undefined,
      dbFile = undefined,
      dbAdapter = undefined,
      loggingLevel = 'warn',
      loggingOptions = undefined,
      syncInitIntervalMs,
      syncIntervalMs,
    } = options || {};
    if (typeof conf === 'string') {
      this.config = await readFromFile(conf);
    } else {
      this.config = conf;
    }
    if (!this.config) {
      this.config = isTestnet ? DefaultClientTestnetConfig : DefaultClientMainnetConfig;
    }
    let wrappedDbFile: string;
    if (!dbFile) {
      wrappedDbFile = isTestnet ? 'mystiko_testnet.db' : 'this.db';
    } else {
      wrappedDbFile = dbFile;
    }
    utils.initLogger(loggingOptions);
    utils.logger.setLevel(loggingLevel);
    this.logger = utils.logger;
    this.db = await createDatabase(wrappedDbFile, dbAdapter);
    this.db.exportDataAsString = exportDataAsString;
    this.db.importDataFromJson = importDataFromJson;
    this.db.importDataFromJsonFile = importDataFromJsonFile;
    this.wallets = new WalletHandler(this.db, this.config);
    this.accounts = new AccountHandler(this.wallets, this.db, this.config);
    this.providers = new ProviderPool(this.config);
    this.providers.connect();
    this.contracts = new ContractHandler(this.db, this.config);
    this.events = new EventHandler(this.db, this.config);
    await this.contracts.importFromConfig();
    this.contractPool = new ContractPool(this.config, this.providers);
    const contracts = this.contracts.getContracts({
      filterFunc: (contract: Contract) => !!contract.version && contract.version > 0,
    });
    this.contractPool.connect(contracts);
    this.notes = new NoteHandler(
      this.wallets,
      this.accounts,
      this.contracts,
      this.providers,
      this.contractPool,
      this.db,
      this.config,
    );
    this.deposits = new DepositHandler(
      this.wallets,
      this.accounts,
      this.notes,
      this.contractPool,
      this.db,
      this.config,
    );
    this.withdraws = new WithdrawHandler(
      this.wallets,
      this.accounts,
      this.contracts,
      this.notes,
      this.events,
      this.providers,
      this.contractPool,
      this.db,
      this.config,
    );
    this.signers = {
      metaMask: new MetaMaskSigner(this.config),
      privateKey: new PrivateKeySigner(this.config, this.providers),
    };
    this.sync = new FullSync(
      this.events,
      this.contracts,
      this.deposits,
      this.withdraws,
      this.notes,
      this.config,
      this.providers,
      syncInitIntervalMs,
      syncIntervalMs,
    );
    this.logger.info('@mystiko/client has been successfully initialized, enjoy!');
  }
}
