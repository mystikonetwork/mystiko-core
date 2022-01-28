/**
 * MystikoJS
 * @author Fitch Li <fitch@mystiko.network>
 *
 * Javascript library of Mystiko.Network's core protocol.
 */
import { ethers } from 'ethers';
import { MystikoConfig, readFromFile } from './config';
import {
  createDatabase,
  exportDataAsString,
  importDataFromJson,
  importDataFromJsonFile,
} from './database.js';
import handler from './handler';
import * as utils from './utils.js';
import * as models from './model';
import { ProviderPool } from './chain/provider.js';
import { ContractPool } from './chain/contract.js';
import { MetaMaskSigner, PrivateKeySigner } from './chain/signer.js';
import logger, { initLogger } from './logger.js';
import { EventPuller } from './puller';
import DefaultTestnetConfigJson from '../config/default/testnet.json';
import DefaultMainnetConfigJson from '../config/default/mainnet.json';

const DefaultTestnetConfig = new MystikoConfig(DefaultTestnetConfigJson);
const DefaultMainnetConfig = new MystikoConfig(DefaultMainnetConfigJson);

/**
 * @external external:Logger
 * @see {@link https://github.com/pimterry/loglevel Logger}
 */
/**
 * @module module:mystiko
 * @desc Core module of Mystiko's privacy preserving protocol.
 * Check {@link https://mystiko.network/whitepaper.pdf Whitepaper} for more information.
 * @property {AccountHandler} accounts handler of Account related business logic
 * @property {MystikoConfig} config loaded configuration instance
 * @property {ContractPool} contractPool pool of wrapped smart contract instances.
 * @property {module:mystiko/db.WrappedDb} db instance of wrapped database handlers.
 * @property {Object} db.adapter instance of the persistent database adapter.
 * @property {Function} db.exportDataAsString export data in database as a JSON string,
 * check {@link module:mystiko/db.exportDataAsString}.
 * @property {Function} db.importDataFromJson import data into database from a JSON string,
 * check {@link module:mystiko/db.importDataFromJson}.
 * @property {Function} db.importDataFromJsonFile import data into database from a JSON file,
 * check {@link module:mystiko/db.importDataFromJsonFile}.
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
 * @property {external:Logger} logger log handler for logging useful information.
 */
const mystiko = { utils, models, ethers };
/**
 * Initialize resources to make Mystiko wallet work.
 * Please call this function at the startup of your application.
 * @function module:mystiko.initialize
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
mystiko.initialize = async ({
  isTestnet = true,
  conf = undefined,
  dbFile = undefined,
  dbAdapter = undefined,
  isStoreEvent = false,
  eventPullingIntervalMs = 60000,
  loggingLevel = 'error',
  loggingOptions = undefined,
} = {}) => {
  utils.check(typeof isTestnet === 'boolean', 'isTestnet should be boolean type');
  if (typeof conf === 'string') {
    mystiko.config = await readFromFile(conf);
  } else if (conf instanceof MystikoConfig) {
    mystiko.config = conf;
  } else if (!conf) {
    mystiko.config = isTestnet ? DefaultTestnetConfig : DefaultMainnetConfig;
  } else {
    throw new Error(`unsupported config type ${typeof conf}`);
  }
  if (dbFile) {
    utils.check(typeof dbFile === 'string', 'dbFile should be string');
  } else {
    dbFile = isTestnet ? 'mystiko_testnet.db' : 'mystiko.db';
  }
  utils.check(typeof loggingLevel === 'string', 'loggingLevel should be a string');
  utils.check(
    !loggingOptions || loggingOptions instanceof Object,
    'loggingOptions should be an instance of Object',
  );
  initLogger(loggingOptions);
  logger.setLevel(loggingLevel);
  mystiko.logger = logger;
  mystiko.db = await createDatabase(dbFile, dbAdapter);
  mystiko.db.adapter = dbAdapter;
  mystiko.db.exportDataAsString = exportDataAsString;
  mystiko.db.importDataFromJson = importDataFromJson;
  mystiko.db.importDataFromJsonFile = importDataFromJsonFile;
  mystiko.wallets = new handler.WalletHandler(mystiko.db, mystiko.config);
  mystiko.accounts = new handler.AccountHandler(mystiko.wallets, mystiko.db, mystiko.config);
  mystiko.providers = new ProviderPool(mystiko.config);
  mystiko.providers.connect();
  mystiko.contractPool = new ContractPool(mystiko.config, mystiko.providers);
  mystiko.contractPool.connect();
  mystiko.notes = new handler.NoteHandler(
    mystiko.wallets,
    mystiko.accounts,
    mystiko.providers,
    mystiko.db,
    mystiko.config,
  );
  mystiko.deposits = new handler.DepositHandler(
    mystiko.wallets,
    mystiko.accounts,
    mystiko.notes,
    mystiko.contractPool,
    mystiko.db,
    mystiko.config,
  );
  mystiko.withdraws = new handler.WithdrawHandler(
    mystiko.wallets,
    mystiko.accounts,
    mystiko.notes,
    mystiko.providers,
    mystiko.contractPool,
    mystiko.db,
    mystiko.config,
  );
  mystiko.contracts = new handler.ContractHandler(mystiko.db, mystiko.config);
  await mystiko.contracts.importFromConfig();
  mystiko.events = new handler.EventHandler(mystiko.db, mystiko.config);
  mystiko.signers = {
    metaMask: new MetaMaskSigner(mystiko.config),
    privateKey: new PrivateKeySigner(mystiko.config, mystiko.providers),
  };
  mystiko.pullers = {
    eventPuller: new EventPuller({
      config: mystiko.config,
      contractHandler: mystiko.contracts,
      walletHandler: mystiko.wallets,
      noteHandler: mystiko.notes,
      depositHandler: mystiko.deposits,
      withdrawHandler: mystiko.withdraws,
      eventHandler: mystiko.events,
      contractPool: mystiko.contractPool,
      isStoreEvent: isStoreEvent,
      pullIntervalMs: eventPullingIntervalMs,
    }),
  };
  mystiko.logger.info('mystiko.js has been successfully initialized, enjoy!');
};
export default mystiko;
