import { hdkey } from 'ethereumjs-wallet';
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
    const wallet = this._checkCurrentWallet();
    const rawAccounts = this.db.accounts.find({ walletId: wallet.id });
    return rawAccounts.map((account) => new Account(account));
  }

  getAccountByShieldedAddress(shieldedAddress) {
    const publicKeys = this.protocol.publicKeysFromShieldedAddress(shieldedAddress);
    return new Account(
      this.db.accounts.findOne({
        verifyPublicKey: toHexNoPrefix(publicKeys.pkVerify),
        encPublicKey: toHexNoPrefix(publicKeys.pkEnc),
      }),
    );
  }

  exportAccountSecretKey(walletPassword, account) {
    check(account instanceof Account, 'account should be instance of Account');
    check(typeof walletPassword === 'string', 'walletPassword should be instance of string');
    const wallet = this._checkCurrentWallet();
    if (!this.walletHandler.checkPassword(wallet, walletPassword)) {
      throw new Error('incorrect walletPassword is given');
    }
    const skVerify = this.protocol.decryptSymmetric(walletPassword, account.encryptedVerifySecretKey);
    const skEnc = this.protocol.decryptSymmetric(walletPassword, account.encryptedEncSecretKey);
    return toHexNoPrefix(this.protocol.fullSecretKey(toBuff(skVerify), toBuff(skEnc)));
  }

  async addAccount(walletPassword, accountName) {
    check(typeof accountName === 'string', 'accountName should be instance of string');
    check(typeof walletPassword === 'string', 'walletPassword should be instance of string');
    const wallet = this._checkCurrentWallet();
    if (!this.walletHandler.checkPassword(wallet, walletPassword)) {
      throw new Error('incorrect walletPassword is given');
    }
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
    const account = this._createAccount(wallet, walletPassword, accountName, skVerify, skEnc);
    this.db.accounts.insert(account.data);
    wallet.accountNonce = wallet.accountNonce + 2;
    this.db.wallets.update(wallet.data);
    await this.saveDatabase();
    return account;
  }

  async importAccountFromSecretKey(walletPassword, accountName, secretKey) {
    check(typeof accountName === 'string', 'accountName should be instance of string');
    check(typeof walletPassword === 'string', 'walletPassword should be instance of string');
    check(secretKey instanceof Buffer, 'secretKey should be instance of Buffer');
    const wallet = this._checkCurrentWallet();
    if (!this.walletHandler.checkPassword(wallet, walletPassword)) {
      throw new Error('incorrect walletPassword is given');
    }
    const secretKeys = this.protocol.separatedSecretKeys(secretKey);
    const verifySecretKey = secretKeys.skVerify;
    const encSecretKey = secretKeys.skEnc;
    const account = this._createAccount(wallet, walletPassword, accountName, verifySecretKey, encSecretKey);
    this.db.accounts.insert(account.data);
    await this.saveDatabase();
    return account;
  }

  async removeAccount(account) {
    check(account instanceof Account, 'account should be instance of Account');
    this.db.accounts.remove(account.data);
    await this.saveDatabase();
    return account;
  }

  async updateAccountKeys(oldPassword, newPassword) {
    check(typeof oldPassword === 'string', 'oldPassword should be instance of string');
    check(typeof newPassword === 'string', 'newPassword should be instance of string');
    const wallet = this._checkCurrentWallet();
    if (!this.walletHandler.checkPassword(wallet, oldPassword)) {
      throw new Error('incorrect walletPassword is given');
    }
    this.getAccounts(wallet).forEach((account) => {
      const verifySecretKey = this.protocol.decryptSymmetric(oldPassword, account.encryptedVerifySecretKey);
      const encSecretKey = this.protocol.decryptSymmetric(oldPassword, account.encryptedEncSecretKey);
      account.encryptedVerifySecretKey = this.protocol.encryptSymmetric(newPassword, verifySecretKey);
      account.encryptedEncSecretKey = this.protocol.encryptSymmetric(newPassword, encSecretKey);
      this.db.accounts.update(account.data);
    });
    await this.saveDatabase();
  }

  _createAccount(wallet, walletPassword, accountName, skVerify, skEnc) {
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

  _checkCurrentWallet() {
    const wallet = this.walletHandler.getCurrentWallet();
    check(wallet, 'no existing wallet in database');
    return wallet;
  }
}
