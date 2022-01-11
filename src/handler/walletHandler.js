import { Handler } from './handler.js';
import { ID_KEY } from '../model/common.js';
import { Wallet } from '../model/wallet.js';

export class WalletHandler extends Handler {
  constructor(db, options) {
    super(db, options);
  }

  async createWallet(masterSeed, walletPassword) {
    const encryptedMasterSeed = Handler.aesEncrypt(masterSeed, walletPassword);
    const hashedPassword = Handler.hmacSHA512(walletPassword);
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
    return null;
  }

  getWalletById(id) {
    const rawWallet = this.db.wallets.findOne({ [ID_KEY]: id });
    if (rawWallet) {
      return new Wallet(rawWallet);
    }
    return null;
  }

  checkPassword(wallet, password) {
    const hashedPassword = Handler.hmacSHA512(password);
    return wallet.hashedPassword === hashedPassword;
  }

  async updatePassword(wallet, oldPassword, newPassword) {
    if (this.checkPassword(wallet, oldPassword)) {
      const decryptedMasterSeed = Handler.aesDecrypt(wallet.encryptedMasterSeed, oldPassword);
      wallet.hashedPassword = Handler.hmacSHA512(newPassword);
      wallet.encryptedMasterSeed = Handler.aesEncrypt(decryptedMasterSeed, newPassword);
      this.db.wallets.update(wallet.data);
      await this.saveDatabase();
      return true;
    }
    return false;
  }
}
