import { hdkey } from 'ethereumjs-wallet';
import { ID_KEY } from '../model/common.js';
import { Account } from '../model/account.js';
import { Handler } from './handler.js';
import { WalletHandler } from './walletHandler.js';
import { check, toBuff, toHexNoPrefix } from '../utils.js';

export class AccountHandler extends Handler {
  constructor(walletHandler, db, config) {
    super(db, config);
    check(walletHandler instanceof WalletHandler, 'walletHandler should be instance of WalletHandler');
    this.walletHandler = walletHandler;
  }

  getAccounts() {
    const wallet = this.walletHandler.checkCurrentWallet();
    const rawAccounts = this.db.accounts.find({ walletId: wallet.id });
    return rawAccounts.map((account) => new Account(account));
  }

  getAccount(query) {
    let account;
    if (typeof query === 'number') {
      account = this.db.accounts.findOne({ [ID_KEY]: query });
    } else if (typeof query === 'string' && this.protocol.isShieldedAddress(query)) {
      const publicKeys = this.protocol.publicKeysFromShieldedAddress(query);
      account = this.db.accounts.findOne({
        verifyPublicKey: toHexNoPrefix(publicKeys.pkVerify),
        encPublicKey: toHexNoPrefix(publicKeys.pkEnc),
      });
    } else if (query instanceof Account) {
      account = query.data;
    }
    if (account) {
      return new Account(account);
    }
    return undefined;
  }

  exportAccountSecretKey(walletPassword, account) {
    check(typeof walletPassword === 'string', 'walletPassword should be instance of string');
    account = this.getAccount(account);
    check(account, `${account.toString()} does not exist`);
    if (!this.walletHandler.checkPassword(walletPassword)) {
      throw new Error('incorrect walletPassword is given');
    }
    const skVerify = this.protocol.decryptSymmetric(walletPassword, account.encryptedVerifySecretKey);
    const skEnc = this.protocol.decryptSymmetric(walletPassword, account.encryptedEncSecretKey);
    return toHexNoPrefix(this.protocol.fullSecretKey(toBuff(skVerify), toBuff(skEnc)));
  }

  async addAccount(walletPassword, accountName) {
    check(typeof accountName === 'string', 'accountName should be instance of string');
    check(typeof walletPassword === 'string', 'walletPassword should be instance of string');
    if (!this.walletHandler.checkPassword(walletPassword)) {
      throw new Error('incorrect walletPassword is given');
    }
    const wallet = this.walletHandler.getCurrentWallet();
    const walletMasterSeed = this.protocol.decryptSymmetric(walletPassword, wallet.encryptedMasterSeed);
    const hdWallet = hdkey.fromMasterSeed(walletMasterSeed);
    let skVerify = null;
    if (wallet.accountNonce === 0) {
      skVerify = hdWallet.getWallet().getPrivateKey();
    } else {
      skVerify = hdWallet.deriveChild(wallet.accountNonce).getWallet().getPrivateKey();
    }
    const skEnc = hdWallet
      .deriveChild(wallet.accountNonce + 1)
      .getWallet()
      .getPrivateKey();
    const account = this._createAccount(walletPassword, accountName, skVerify, skEnc);
    this.db.accounts.insert(account.data);
    wallet.accountNonce = wallet.accountNonce + 2;
    this.db.wallets.update(wallet.data);
    await this.saveDatabase();
    return account;
  }

  async importAccountFromSecretKey(walletPassword, accountName, secretKey) {
    check(typeof accountName === 'string', 'accountName should be instance of string');
    check(typeof walletPassword === 'string', 'walletPassword should be instance of string');
    check(typeof secretKey === 'string', 'secretKey should be instance of string');
    if (!this.walletHandler.checkPassword(walletPassword)) {
      throw new Error('incorrect walletPassword is given');
    }
    const secretKeys = this.protocol.separatedSecretKeys(toBuff(secretKey));
    const verifySecretKey = secretKeys.skVerify;
    const encSecretKey = secretKeys.skEnc;
    const account = this._createAccount(walletPassword, accountName, verifySecretKey, encSecretKey);
    const existingAccount = this.getAccount(account.shieldedAddress);
    if (existingAccount) {
      existingAccount.name = accountName;
      this.db.accounts.update(existingAccount.data);
      await this.saveDatabase();
    } else {
      this.db.accounts.insert(account.data);
      await this.saveDatabase();
    }
    return account;
  }

  async removeAccount(account) {
    account = this.getAccount(account);
    check(account, `${account.toString()} does not exist`);
    this.db.accounts.remove(account.data);
    await this.saveDatabase();
    return account;
  }

  async updateAccountKeys(oldPassword, newPassword) {
    check(typeof oldPassword === 'string', 'oldPassword should be instance of string');
    check(typeof newPassword === 'string', 'newPassword should be instance of string');
    if (!this.walletHandler.checkPassword(oldPassword)) {
      throw new Error('incorrect walletPassword is given');
    }
    this.getAccounts().forEach((account) => {
      const verifySecretKey = this.protocol.decryptSymmetric(oldPassword, account.encryptedVerifySecretKey);
      const encSecretKey = this.protocol.decryptSymmetric(oldPassword, account.encryptedEncSecretKey);
      account.encryptedVerifySecretKey = this.protocol.encryptSymmetric(newPassword, verifySecretKey);
      account.encryptedEncSecretKey = this.protocol.encryptSymmetric(newPassword, encSecretKey);
      this.db.accounts.update(account.data);
    });
    await this.saveDatabase();
  }

  async updateAccountName(account, newName) {
    check(typeof newName === 'string', 'newName should be instance of string');
    account = this.getAccount(account);
    check(account, `${account.toString()} does not exist`);
    account.name = newName;
    this.db.accounts.update(account.data);
    await this.saveDatabase();
  }

  _createAccount(walletPassword, accountName, skVerify, skEnc) {
    const wallet = this.walletHandler.getCurrentWallet();
    const account = new Account();
    account.name = accountName;
    account.walletId = wallet.id;
    account.verifyPublicKey = this.protocol.publicKeyForVerification(skVerify);
    account.encPublicKey = this.protocol.publicKeyForEncryption(skEnc);
    account.encryptedVerifySecretKey = this.protocol.encryptSymmetric(
      walletPassword,
      toHexNoPrefix(skVerify),
    );
    account.encryptedEncSecretKey = this.protocol.encryptSymmetric(walletPassword, toHexNoPrefix(skEnc));
    return account;
  }
}
