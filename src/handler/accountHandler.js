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
    return this.db.wallets.find({ walletId: wallet.id }).forEach((account) => new Account(account));
  }

  getAccountByShieldedAddress(shieldedAddress) {
    const publicKeys = Account.getPublicKeys(shieldedAddress);
    return new Account(
      this.db.accounts.findOne({ verifyPublicKey: publicKeys[0], encPublicKey: publicKeys[1] }),
    );
  }

  exportAccountSecretKey(wallet, account, walletPassword) {
    if (!this.walletHandler.checkPassword(wallet, walletPassword)) {
      throw 'incorrect walletPassword is given';
    }
    const verifySecretKey = Handler.aesDecrypt(account.encryptedVerifySecretKey, walletPassword);
    const encSecretKey = Handler.aesDecrypt(account.encryptedEncSecretKey, walletPassword);
    const secretKey = Buffer.concat([Buffer.from(verifySecretKey, 'hex'), Buffer.from(encSecretKey, 'hex')]);
    return secretKey.toString('hex');
  }

  async addAccount(wallet, walletPassword, accountName) {
    if (!this.walletHandler.checkPassword(wallet, walletPassword)) {
      throw 'incorrect walletPassword is given';
    }
    const walletMasterSeed = Handler.aesDecrypt(wallet.encryptedMasterSeed, walletPassword);
    const hdWallet = hdkey.fromMasterSeed(walletMasterSeed);
    let verifySecretKey = null;
    if (this.keyNonce === 0) {
      verifySecretKey = hdWallet.getWallet().getPrivateKey();
    } else {
      verifySecretKey = hdWallet.deriveChild(wallet.accountNonce).getWallet().getPrivateKey();
    }
    const unpackedVerifyPublicKey = eddsa.prv2pub(verifySecretKey);
    const verifyPublicKey = Buffer.from(babyJub.packPoint(unpackedVerifyPublicKey));
    const encSecretKey = hdWallet
      .deriveChild(wallet.accountNonce + 1)
      .getWallet()
      .getPrivateKey();
    const encPublicKey = new EciesPrivateKey(encSecretKey).publicKey.compressed;
    const accountData = {
      walletId: wallet.id,
      name: accountName,
      verifyPublicKey: verifyPublicKey.toString('hex'),
      encryptedVerifySecretKey: Handler.aesEncrypt(verifySecretKey.toString('hex'), walletPassword),
      encPublicKey: encPublicKey.toString('hex'),
      encryptedEncSecretKey: Handler.aesEncrypt(encSecretKey.toString('hex'), walletPassword),
    };
    const account = new Account(this.db.accounts.insert(accountData));
    wallet.accountNonce = wallet.accountNonce + 2;
    this.db.wallets.update(wallet);
    await this.saveDatabase();
    return account;
  }

  async importAccountFromSecretKey(wallet, walletPassword, accountName, secretKey) {
    if (!this.walletHandler.checkPassword(wallet, walletPassword)) {
      throw 'incorrect walletPassword is given';
    }
    const secretKeys = Account.getSecretKeys(secretKey);
    const verifySecretKey = secretKeys[0];
    const encSecretKey = secretKeys[1];
    const unpackedVerifyPublicKey = eddsa.prv2pub(verifySecretKey);
    const verifyPublicKey = Buffer.from(babyJub.packPoint(unpackedVerifyPublicKey));
    const encPublicKey = new EciesPrivateKey(encSecretKey).publicKey.compressed;
    const accountData = {
      walletId: wallet.id,
      name: accountName,
      verifyPublicKey: verifyPublicKey.toString('hex'),
      encryptedVerifySecretKey: Handler.aesEncrypt(verifySecretKey.toString('hex'), walletPassword),
      encPublicKey: encPublicKey.toString('hex'),
      encryptedEncSecretKey: Handler.aesEncrypt(encSecretKey.toString('hex'), walletPassword),
    };
    const account = new Account(this.db.accounts.insert(accountData));
    await this.saveDatabase();
    return account;
  }

  async removeAccount(account) {
    this.db.accounts.remove(account);
    await this.saveDatabase();
    return account;
  }
}
