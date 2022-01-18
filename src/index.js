import { ethers } from 'ethers';
import config from './config';
import { createDatabase } from './database.js';
import handler from './handler';
import * as utils from './utils.js';
import models from './model';
import { ContractPool } from './chain/contract';

export class Mystiko {
  constructor() {
    this.utils = utils;
    this.models = models;
    this.ethers = ethers;
  }

  async initialize(configFile, dbFile, dbAdapter) {
    this.config = await config.readFromFile(configFile);
    this.db = await createDatabase(dbFile, dbAdapter);
    this.wallets = new handler.WalletHandler(this.db, this.config);
    this.accounts = new handler.AccountHandler(this.wallets, this.db, this.config);
    this.contracts = new ContractPool(this.config);
    await this.contracts.connect();
    this.deposits = new handler.DepositHandler(this.wallets, this.contracts, this.db, this.config);
  }
}

export default new Mystiko();
