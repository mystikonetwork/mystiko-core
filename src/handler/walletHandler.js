import { Handler } from './handler.js';
import { ID_KEY } from '../model/common.js';
import { Wallet } from '../model/wallet.js';

export class WalletHandler extends Handler {
  constructor(db, options) {
    super(db, options);
    if (!this.options['salt'] && this.options['salt'].length == 0) {
      throw 'not include invalid salt';
    }
  }

  async createWallet(masterSeed, walletPassword) {
    const encryptedMasterSeed = Handler.aesEncrypt(masterSeed, walletPassword);
    const hashedPassword = this.hashPassword(walletPassword);
    const data = {
      encryptedMasterSeed: encryptedMasterSeed,
      hashedPassword: hashedPassword,
      accountNoncce: 0,
    };
    const wallet = new Wallet(this.db.wallets.insert(data));
    await this.saveDatabase();
    return wallet;
  }

  getCurrentWallet() {
    return new Wallet(this.db.wallets.chain().find().simplesort(ID_KEY, { desc: true }).data()[0]);
  }

  getWallet(id) {
    return new Wallet(this.db.wallets.findOne({ ID_KEY: id }));
  }

  checkPassword(wallet, password) {
    const hashedPassword = this.hashPassword(password);
    return wallet.hashedPassword === hashedPassword;
  }

  async updatePassword(wallet, oldPassword, newPassword) {
    if (this.checkPassword(wallet, oldPassword)) {
      const decryptedMasterSeed = Handler.aesDecrypt(wallet.encryptedMasterSeed, oldPassword);
      wallet.hashedPassword = this.hashPassword(newPassword);
      wallet.encryptedMasterSeed = Handler.aesEncrypt(decryptedMasterSeed, newPassword);
      this.db.wallets.update(wallet.data);
      this.db.accounts
        .find({ walletId: wallet.id })
        .forEach((account) => this.updateEncryptedAccountKeys(account, oldPassword, newPassword));
      await this.saveDatabase();
      return true;
    }
    return false;
  }

  hashPassword(password) {
    return Handler.hmacSHA512(password, this.options['salt']);
  }

  updateEncryptedAccountKeys(account, oldPassword, newPassword) {
    const verifySecretKey = Handler.aesDecrypt(account.encryptedVerifySecretKey, oldPassword);
    const encSecretKey = Handler.aesDecrypt(account.encryptedEncSecretKey, oldPassword);
    account.encryptedVerifySecretKey = Handler.aesEncrypt(verifySecretKey, newPassword);
    account.encryptedEncSecretKey = Handler.aesEncrypt(encSecretKey, newPassword);
    this.db.accounts.update(account.data);
  }
}
