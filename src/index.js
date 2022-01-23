/**
 * MystikoJS
 * @author Fitch Li <fitch@mystiko.network>
 *
 * Javascript library of Mystiko.Network's core protocol.
 */
import { ethers } from 'ethers';
import { MystikoConfig, readFromFile, DefaultTestnetConfig, DefaultMainnetConfig } from './config';
import { createDatabase } from './database.js';
import handler from './handler';
import * as utils from './utils.js';
import * as models from './model';
import { ProviderPool } from './chain/provider.js';
import { ContractPool } from './chain/contract.js';
import { MetaMaskSigner } from './chain/signer.js';

/**
 * @module module:mystiko
 * @desc Core module of Mystiko's privacy preserving protocol.
 * Check {@link https://mystiko.network/whitepaper.pdf Whitepaper} for more information.
 * @property {AccountHandler} accounts handler of Account related business logic
 * @property {MystikoConfig} config loaded configuration instance
 * @property {ContractPool} contracts pool of wrapped smart contract instances.
 * @property {module:mystiko/db.WrappedDb} db instance of wrapped database handlers.
 * @property {Object} db.adapter instance of the persistent database adapter.
 * @property {DepositHandler} deposits handler of Deposit related business logic.
 * @property {Object} ethers {@link https://docs.ethers.io/v5/ ethers.js} instance.
 * @property {module:mystiko/models} models a collection Mystiko data models and helper functions.
 * @property {NoteHandler} notes handler of PrivateNote related business logic.
 * @property {ProviderPool} providers pool of configured JSON-RPC providers for different blockchains.
 * @property {Object} signers object including supported transaction signers.
 * @property {MetaMaskSigner} signers.metaMask transaction signer with MetaMask.
 * @property {module:mystiko/utils} utils a collection of util functions.
 * @property {WalletHandler} wallets handler of Wallet related business logic.
 * @property {WithdrawHandler} withdraws handler of Withdraw related business logic.
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
 * @returns {Promise<void>}
 */
mystiko.initialize = async ({
  isTestnet = true,
  conf = undefined,
  dbFile = undefined,
  dbAdapter = undefined,
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
  mystiko.db = await createDatabase(dbFile, dbAdapter);
  mystiko.db.adapter = dbAdapter;
  mystiko.wallets = new handler.WalletHandler(mystiko.db, mystiko.config);
  mystiko.accounts = new handler.AccountHandler(mystiko.wallets, mystiko.db, mystiko.config);
  mystiko.providers = new ProviderPool(mystiko.config);
  mystiko.providers.connect();
  mystiko.contracts = new ContractPool(mystiko.config, mystiko.providers);
  mystiko.contracts.connect();
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
    mystiko.contracts,
    mystiko.db,
    mystiko.config,
  );
  mystiko.withdraws = new handler.WithdrawHandler(
    mystiko.wallets,
    mystiko.accounts,
    mystiko.notes,
    mystiko.providers,
    mystiko.contracts,
    mystiko.db,
    mystiko.config,
  );
  mystiko.signers = {
    metaMask: new MetaMaskSigner(mystiko.config),
  };
};
export default mystiko;
