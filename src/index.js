import { ethers } from 'ethers';
import config from './config';
import { createDatabase } from './database.js';
import handler from './handler';
import * as utils from './utils.js';
import models from './model';
import { ProviderPool } from './chain/provider.js';
import { ContractPool } from './chain/contract.js';
import { MetaMaskSigner } from './chain/signer.js';

const mystiko = { utils, models, ethers };
mystiko.initialize = async (configFile, dbFile, dbAdapter) => {
  utils.check(typeof configFile === 'string', 'configFile should be string');
  utils.check(typeof dbFile === 'string', 'dbFile should be string');
  mystiko.conf = await config.readFromFile(configFile);
  mystiko.db = await createDatabase(dbFile, dbAdapter);
  mystiko.db.adapter = dbAdapter;
  mystiko.wallets = new handler.WalletHandler(mystiko.db, mystiko.conf);
  mystiko.accounts = new handler.AccountHandler(mystiko.wallets, mystiko.db, mystiko.conf);
  mystiko.providers = new ProviderPool(mystiko.conf);
  mystiko.providers.connect();
  mystiko.contracts = new ContractPool(mystiko.conf, mystiko.providers);
  await mystiko.contracts.connect();
  mystiko.deposits = new handler.DepositHandler(mystiko.wallets, mystiko.contracts, mystiko.db, mystiko.conf);
  mystiko.notes = new handler.NoteHandler(
    mystiko.wallets,
    mystiko.accounts,
    mystiko.providers,
    mystiko.db,
    mystiko.conf,
  );
  mystiko.withdraws = new handler.WithdrawHandler(
    mystiko.wallets,
    mystiko.accounts,
    mystiko.notes,
    mystiko.providers,
    mystiko.contracts,
    mystiko.db,
    mystiko.conf,
  );
  mystiko.signers = {
    metaMask: new MetaMaskSigner(mystiko.conf),
  };
};
export default mystiko;
