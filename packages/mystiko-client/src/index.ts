/**
 * MystikoJS
 * @author Fitch Li <fitch@bundled.network>
 *
 * Javascript library of bundled.Network's core protocol.
 */
import { Logger, LogLevelDesc } from 'loglevel';
import { LoglevelPluginPrefixOptions } from 'loglevel-plugin-prefix';
import { MystikoConfig, AssetType, BridgeType, readFromFile } from '@mystiko/config';
import * as utils from '@mystiko/utils';
import { createDatabase, exportDataAsString, importDataFromJson, importDataFromJsonFile } from './database';
import * as models from './model';
import { ProviderPool, ContractPool, MetaMaskSigner, PrivateKeySigner } from './chain';
import { EventPuller } from './puller';
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

export interface InitOptions {
  isTestnet?: boolean;
  conf?: string | MystikoConfig;
  dbFile?: string;
  dbAdapter?: LokiPersistenceAdapter;
  isStoreEvent?: boolean;
  eventPullingIntervalMs?: number;
  loggingLevel?: LogLevelDesc;
  loggingOptions?: LoglevelPluginPrefixOptions;
}

/**
 * @module module:mystiko
 * @desc Core module of Mystiko's privacy preserving protocol.
 * Check {@link https://bundled.network/whitepaper.pdf Whitepaper} for more information.
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
 * @property {EventPuller} pullers.eventPuller puller that pulling events in fixed time frame.
 * @property {Logger} logger log handler for logging useful information.
 */
export interface MystikoInterface {
  models: any;
  utils: any;
  initialize: (options?: InitOptions) => Promise<void>;
  config?: MystikoConfig;
  logger?: Logger;
  db?: any;
  wallets?: WalletHandler;
  accounts?: AccountHandler;
  providers?: ProviderPool;
  contracts?: ContractHandler;
  contractPool?: ContractPool;
  notes?: NoteHandler;
  deposits?: DepositHandler;
  withdraws?: WithdrawHandler;
  events?: EventHandler;
  signers?: { metaMask: MetaMaskSigner; privateKey: PrivateKeySigner };
  pullers?: { eventPuller: EventPuller };
}

const bundled: any = { models: { ...models, AssetType, BridgeType }, utils };
/**
 * Initialize resources to make Mystiko wallet work.
 * Please call this function at the startup of your application.
 * @function module:bundled.initialize
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
bundled.initialize = async (options?: InitOptions) => {
  const {
    isTestnet = true,
    conf = undefined,
    dbFile = undefined,
    dbAdapter = undefined,
    isStoreEvent = false,
    eventPullingIntervalMs = 60000,
    loggingLevel = 'error',
    loggingOptions = undefined,
  } = options || {};
  if (typeof conf === 'string') {
    bundled.config = await readFromFile(conf);
  } else {
    bundled.config = conf;
  }
  if (!bundled.config) {
    bundled.config = new MystikoConfig({ version: '1.0' });
  }
  let wrappedDbFile: string;
  if (!dbFile) {
    wrappedDbFile = isTestnet ? 'mystiko_testnet.db' : 'bundled.db';
  } else {
    wrappedDbFile = dbFile;
  }
  utils.initLogger(loggingOptions);
  utils.logger.setLevel(loggingLevel);
  bundled.logger = utils.logger;
  bundled.db = await createDatabase(wrappedDbFile, dbAdapter);
  bundled.db.exportDataAsString = exportDataAsString;
  bundled.db.importDataFromJson = importDataFromJson;
  bundled.db.importDataFromJsonFile = importDataFromJsonFile;
  bundled.wallets = new WalletHandler(bundled.db, bundled.config);
  bundled.accounts = new AccountHandler(bundled.wallets, bundled.db, bundled.config);
  bundled.providers = new ProviderPool(bundled.config);
  bundled.providers.connect();
  bundled.contracts = new ContractHandler(bundled.db, bundled.config);
  await bundled.contracts.importFromConfig();
  bundled.contractPool = new ContractPool(bundled.config, bundled.providers);
  const contracts = bundled.contracts.getContracts({
    filterFunc: (contract: Contract) => !!contract.version && contract.version > 0,
  });
  bundled.contractPool.connect(contracts);
  bundled.notes = new NoteHandler(
    bundled.wallets,
    bundled.accounts,
    bundled.contracts,
    bundled.providers,
    bundled.contractPool,
    bundled.db,
    bundled.config,
  );
  bundled.deposits = new DepositHandler(
    bundled.wallets,
    bundled.accounts,
    bundled.notes,
    bundled.contractPool,
    bundled.db,
    bundled.config,
  );
  bundled.withdraws = new WithdrawHandler(
    bundled.wallets,
    bundled.accounts,
    bundled.contracts,
    bundled.notes,
    bundled.providers,
    bundled.contractPool,
    bundled.db,
    bundled.config,
  );
  bundled.events = new EventHandler(bundled.db, bundled.config);
  bundled.signers = {
    metaMask: new MetaMaskSigner(bundled.config),
    privateKey: new PrivateKeySigner(bundled.config, bundled.providers),
  };
  bundled.pullers = {
    eventPuller: new EventPuller({
      config: bundled.config,
      contractHandler: bundled.contracts,
      walletHandler: bundled.wallets,
      noteHandler: bundled.notes,
      depositHandler: bundled.deposits,
      withdrawHandler: bundled.withdraws,
      eventHandler: bundled.events,
      contractPool: bundled.contractPool,
      isStoreEvent,
      pullIntervalMs: eventPullingIntervalMs,
    }),
  };
  bundled.logger.info('bundled.js has been successfully initialized, enjoy!');
};

const mystiko: MystikoInterface = bundled;
export default mystiko;
export * from './database';
export * from './chain';
export * from './handler';
export * from './model';
export * from './puller';
export * from './version';
