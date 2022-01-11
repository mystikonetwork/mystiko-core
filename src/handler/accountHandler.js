import { hdkey } from 'ethereumjs-wallet';
import { babyJub, eddsa } from 'circomlib';
import { PrivateKey as EciesPrivateKey } from 'eciesjs';
import { Account } from '../model/account.js';
import { Handler } from './handler.js';

export class AccountHandler extends Handler {
  constructor(walletHandler, db, options) {
    super(db, options);
    this.walletHandler = walletHandler;
  }

  getAccounts(wallet) {
    const rawAccounts = this.db.accounts.find({ walletId: wallet.id });
    return rawAccounts.map((account) => new Account(account));
  }

  getAccountByShieldedAddress(shieldedAddress) {
    const publicKeys = Account.getPublicKeys(shieldedAddress);
    return new Account(
      this.db.accounts.findOne({ verifyPublicKey: publicKeys[0], encPublicKey: publicKeys[1] }),
    );
  }

  exportAccountSecretKey(wallet, walletPassword, account) {
    if (!this.walletHandler.checkPassword(wallet, walletPassword)) {
      throw new Error('incorrect walletPassword is given');
    }
    const verifySecretKey = Handler.aesDecrypt(account.encryptedVerifySecretKey, walletPassword);
    const encSecretKey = Handler.aesDecrypt(account.encryptedEncSecretKey, walletPassword);
    const secretKey = Buffer.concat([Buffer.from(verifySecretKey, 'hex'), Buffer.from(encSecretKey, 'hex')]);
    return secretKey.toString('hex');
  }

  async addAccount(wallet, walletPassword, accountName) {
    if (!this.walletHandler.checkPassword(wallet, walletPassword)) {
      throw new Error('incorrect walletPassword is given');
    }
    const walletMasterSeed = Handler.aesDecrypt(wallet.encryptedMasterSeed, walletPassword);
    const hdWallet = hdkey.fromMasterSeed(walletMasterSeed);
    let verifySecretKey = null;
    if (wallet.accountNonce === 0) {
      verifySecretKey = hdWallet.getWallet().getPrivateKey();
    } else {
      verifySecretKey = hdWallet.deriveChild(wallet.accountNonce).getWallet().getPrivateKey();
    }
    const encSecretKey = hdWallet
      .deriveChild(wallet.accountNonce + 1)
      .getWallet()
      .getPrivateKey();
    const accountData = this._createAccountData(
      wallet,
      walletPassword,
      accountName,
      verifySecretKey,
      encSecretKey,
    );
    const account = new Account(this.db.accounts.insert(accountData));
    wallet.accountNonce = wallet.accountNonce + 2;
    this.db.wallets.update(wallet.data);
    await this.saveDatabase();
    return account;
  }

  async importAccountFromSecretKey(wallet, walletPassword, accountName, secretKey) {
    if (!this.walletHandler.checkPassword(wallet, walletPassword)) {
      throw new Error('incorrect walletPassword is given');
    }
    const secretKeys = Account.getSecretKeys(secretKey);
    const verifySecretKey = secretKeys[0];
    const encSecretKey = secretKeys[1];
    const accountData = this._createAccountData(
      wallet,
      walletPassword,
      accountName,
      verifySecretKey,
      encSecretKey,
    );
    const account = new Account(this.db.accounts.insert(accountData));
    await this.saveDatabase();
    return account;
  }

  async removeAccount(account) {
    this.db.accounts.remove(account.data);
    await this.saveDatabase();
    return account;
  }

  async updateAccountKeys(wallet, oldPassword, newPassword) {
    if (!this.walletHandler.checkPassword(wallet, oldPassword)) {
      throw new Error('incorrect walletPassword is given');
    }
    this.getAccounts(wallet).forEach((account) => {
      const verifySecretKey = Handler.aesDecrypt(account.encryptedVerifySecretKey, oldPassword);
      const encSecretKey = Handler.aesDecrypt(account.encryptedEncSecretKey, oldPassword);
      account.encryptedVerifySecretKey = Handler.aesEncrypt(verifySecretKey, newPassword);
      account.encryptedEncSecretKey = Handler.aesEncrypt(encSecretKey, newPassword);
      this.db.accounts.update(account.data);
    });
    await this.saveDatabase();
  }

  _createAccountData(wallet, walletPassword, accountName, verifySecretKey, encSecretKey) {
    if (typeof verifySecretKey === 'string' || verifySecretKey instanceof String) {
      verifySecretKey = Buffer.from(verifySecretKey, 'hex');
      encSecretKey = Buffer.from(encSecretKey, 'hex');
    }
    const unpackedVerifyPublicKey = eddsa.prv2pub(verifySecretKey);
    const verifyPublicKey = Buffer.from(babyJub.packPoint(unpackedVerifyPublicKey));
    const encPublicKey = new EciesPrivateKey(encSecretKey).publicKey.compressed;
    return {
      walletId: wallet.id,
      name: accountName,
      verifyPublicKey: verifyPublicKey.toString('hex'),
      encryptedVerifySecretKey: Handler.aesEncrypt(verifySecretKey.toString('hex'), walletPassword),
      encPublicKey: encPublicKey.toString('hex'),
      encryptedEncSecretKey: Handler.aesEncrypt(encSecretKey.toString('hex'), walletPassword),
    };
  }
}
