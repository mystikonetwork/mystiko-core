import { Handler } from './handler.js';
import { ID_KEY } from '../model/common.js';
import { Wallet } from '../model/wallet.js';
import { check } from '../utils.js';

export class WalletHandler extends Handler {
  constructor(db, config) {
    super(db, config);
  }

  async createWallet(masterSeed, walletPassword) {
    check(typeof masterSeed === 'string', 'masterSeed should be instance of string');
    check(typeof walletPassword === 'string', 'walletPassword should be instance of string');
    const encryptedMasterSeed = this.protocol.encryptSymmetric(walletPassword, masterSeed);
    const hashedPassword = this.protocol.checkSum(walletPassword);
    const data = {
      encryptedMasterSeed: encryptedMasterSeed,
      hashedPassword: hashedPassword,
      accountNonce: 0,
    };
    const wallet = new Wallet(this.db.wallets.insert(data));
    await this.saveDatabase();
    return wallet;
  }

  getCurrentWallet() {
    const results = this.db.wallets.chain().find().simplesort(ID_KEY, { desc: true }).data();
    if (results.length > 0) {
      return new Wallet(results[0]);
    }
    return undefined;
  }

  checkCurrentWallet() {
    const wallet = this.getCurrentWallet();
    check(wallet, 'no existing wallet in database');
    return wallet;
  }

  getWalletById(id) {
    check(typeof id === 'number', 'id should be instance of number');
    const rawWallet = this.db.wallets.findOne({ [ID_KEY]: id });
    if (rawWallet) {
      return new Wallet(rawWallet);
    }
    return undefined;
  }

  checkPassword(password) {
    check(typeof password === 'string', 'password should be instance of string');
    const wallet = this.checkCurrentWallet();
    const hashedPassword = this.protocol.checkSum(password);
    return wallet.hashedPassword === hashedPassword;
  }

  async updatePassword(oldPassword, newPassword) {
    check(typeof oldPassword === 'string', 'oldPassword should be instance of string');
    check(typeof newPassword === 'string', 'newPassword should be instance of string');
    const wallet = this.checkCurrentWallet();
    if (this.checkPassword(oldPassword)) {
      const decryptedMasterSeed = this.protocol.decryptSymmetric(oldPassword, wallet.encryptedMasterSeed);
      wallet.hashedPassword = this.protocol.checkSum(newPassword);
      wallet.encryptedMasterSeed = this.protocol.encryptSymmetric(newPassword, decryptedMasterSeed);
      this.db.wallets.update(wallet.data);
      await this.saveDatabase();
      return true;
    }
    return false;
  }
}
