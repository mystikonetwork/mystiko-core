import { ethers } from 'ethers';
import { MystikoConfig, readFromFile, DefaultTestnetConfig, DefaultMainnetConfig } from './config';
import { createDatabase } from './database.js';
import handler from './handler';
import * as utils from './utils.js';
import models from './model';
import { ProviderPool } from './chain/provider.js';
import { ContractPool } from './chain/contract.js';
import { MetaMaskSigner } from './chain/signer.js';

const mystiko = { utils, models, ethers };
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
