import { hdkey } from 'ethereumjs-wallet';
import { ID_KEY, Account } from '../model';
import { Handler } from './handler.js';
import { WalletHandler } from './walletHandler.js';
import { check, toBuff, toHexNoPrefix, toString } from '@mystiko/utils';
import rootLogger from '../logger.js';

/**
 * @class AccountHandler
 * @extends Handler
 * @param {WalletHandler} walletHandler instance of {@link WalletHandler}.
 * @param {module:mystiko/db.WrappedDb} db instance of {@link module:mystiko/db.WrappedDb}.
 * @param {MystikoConfig} config instance of {@link MystikoConfig}.
 * @desc handler class for Account related business logic
 */
export class AccountHandler extends Handler {
  constructor(walletHandler, db, config) {
    super(db, config);
    check(walletHandler instanceof WalletHandler, 'walletHandler should be instance of WalletHandler');
    this.walletHandler = walletHandler;
    this.logger = rootLogger.getLogger('AccountHandler');
  }

  /**
   * @desc get all current managed {@link Account} as an array from the database.
   * @returns {Account[]} an array of {@link Account}.
   */
  getAccounts() {
    const wallet = this.walletHandler.checkCurrentWallet();
    const rawAccounts = this.db.accounts.find({ walletId: wallet.id });
    return rawAccounts.map((account) => new Account(account));
  }

  /**
   * @desc get {@link Account} based on the given query.
   * @param {number|string|Account} query if the query is a number, it searches the database by using the query as id.
   * If the query is a string, and it is a valid shielded address format, it searches the database by using the
   * query as {@link Account#shieldedAddress}. If the query is instance of {@link Account},
   * it just returns that account.
   * @returns {Account|undefined}
   */
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

  /**
   * @desc export account's full secret key as a string.
   * @param {string} walletPassword password of current running wallet.
   * @param {number|string|Account} account account id or shielded address or instance of {@link Account}.
   * @returns {string} a full secret key in plain text.
   * @throws {Error} if the given wallet password is incorrect.
   */
  exportAccountSecretKey(walletPassword, account) {
    check(typeof walletPassword === 'string', 'walletPassword should be instance of string');
    account = this.getAccount(account);
    check(account, `${account.toString()} does not exist`);
    check(this.walletHandler.checkPassword(walletPassword), 'incorrect walletPassword is given');
    const skVerify = this.protocol.decryptSymmetric(walletPassword, account.encryptedVerifySecretKey);
    const skEnc = this.protocol.decryptSymmetric(walletPassword, account.encryptedEncSecretKey);
    return toHexNoPrefix(this.protocol.fullSecretKey(toBuff(skVerify), toBuff(skEnc)));
  }

  /**
   * @desc add a new account with the given account name. The generated secret keys are based on the
   * master seed from the wallet.
   * @param {string} walletPassword the password of the current running wallet.
   * @param {string | undefined} [accountName] name of account.
   * @returns {Promise<Account>} promise of an instance of {@link Account}.
   * @throws {Error} if the given wallet password is incorrect.
   */
  async addAccount(walletPassword, accountName) {
    check(!accountName || typeof accountName === 'string', 'accountName should be instance of string');
    check(typeof walletPassword === 'string', 'walletPassword should be instance of string');
    check(this.walletHandler.checkPassword(walletPassword), 'incorrect walletPassword is given');
    if (!accountName || accountName === '') {
      accountName = this._defaultAccountName();
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
    this.logger.info(`successfully added an account(id=${account.id})`);
    return account;
  }

  /**
   * @desc import an account from the given full secret key.
   * @param {string} walletPassword the password of the current running wallet.
   * @param {string | undefined} [accountName] name of account.
   * @param {string} secretKey the full secret key in plain text.
   * @returns {Promise<Account>} promise of an instance of {@link Account}.
   * @throws {Error} if the given wallet password is incorrect.
   */
  async importAccountFromSecretKey(walletPassword, accountName, secretKey) {
    check(typeof !accountName || accountName === 'string', 'accountName should be instance of string');
    check(typeof walletPassword === 'string', 'walletPassword should be instance of string');
    check(typeof secretKey === 'string', 'secretKey should be instance of string');
    check(this.walletHandler.checkPassword(walletPassword), 'incorrect walletPassword is given');
    if (!accountName || accountName === '') {
      accountName = this._defaultAccountName();
    }
    const secretKeys = this.protocol.separatedSecretKeys(toBuff(secretKey));
    const verifySecretKey = secretKeys.skVerify;
    const encSecretKey = secretKeys.skEnc;
    const account = this._createAccount(walletPassword, accountName, verifySecretKey, encSecretKey);
    const existingAccount = this.getAccount(account.shieldedAddress);
    if (existingAccount) {
      this.logger.info(
        `there is an existing account(id=${existingAccount.id})` +
          'matches this secret key, so updating the existing account',
      );
      existingAccount.name = accountName;
      this.db.accounts.update(existingAccount.data);
      await this.saveDatabase();
    } else {
      this.db.accounts.insert(account.data);
      await this.saveDatabase();
      this.logger.info(`successfully imported an new account(id=${account.id})`);
    }
    return account;
  }

  /**
   * @desc remove account from wallet.
   * @param {string} walletPassword the password of the current running wallet.
   * @param {number|string|Account} account account id or shielded address or instance of {@link Account}.
   * @returns {Promise<Account>} promise of the removed account.
   * @throws {Error} if the given account does not exist or the given wallet password is incorrect.
   */
  async removeAccount(walletPassword, account) {
    check(typeof walletPassword === 'string', 'walletPassword should be instance of string');
    check(this.walletHandler.checkPassword(walletPassword), 'incorrect walletPassword is given');
    account = this.getAccount(account);
    check(account, `${account.toString()} does not exist`);
    this.db.accounts.remove(account.data);
    await this.saveDatabase();
    this.logger.info(`successfully removed account(id=${account.id})`);
    return account;
  }

  /**
   * @desc update the encrypted secret keys with the new password. You should call this function
   * before you update the password of your wallet.
   * @param {string} oldPassword the old password.
   * @param {string} newPassword the new password.
   * @returns {Promise<void>}
   */
  async updateAccountKeys(oldPassword, newPassword) {
    check(typeof oldPassword === 'string', 'oldPassword should be instance of string');
    check(typeof newPassword === 'string', 'newPassword should be instance of string');
    check(this.walletHandler.checkPassword(oldPassword), 'incorrect walletPassword is given');
    this.getAccounts().forEach((account) => {
      this.logger.info(`updating account(id=${account.id}) encrypted secret keys`);
      const verifySecretKey = this.protocol.decryptSymmetric(oldPassword, account.encryptedVerifySecretKey);
      const encSecretKey = this.protocol.decryptSymmetric(oldPassword, account.encryptedEncSecretKey);
      account.encryptedVerifySecretKey = this.protocol.encryptSymmetric(newPassword, verifySecretKey);
      account.encryptedEncSecretKey = this.protocol.encryptSymmetric(newPassword, encSecretKey);
      this.db.accounts.update(account.data);
    });
    await this.saveDatabase();
    this.logger.info('successfully updated all accounts encrypted secret keys');
  }

  /**
   * @desc update the name of the given account.
   * @param {string} walletPassword the password of the current running wallet.
   * @param {number|string|Account} account account id or shielded address or instance of {@link Account}.
   * @param {string | undefined} newName new name of the account.
   * @returns {Promise<Account>} the updated instance of {@link Account}.
   * @throws {Error} if the given wallet password is incorrect.
   */
  async updateAccountName(walletPassword, account, newName) {
    check(typeof walletPassword === 'string', 'walletPassword should be instance of string');
    check(!newName || typeof newName === 'string', 'newName should be instance of string');
    check(this.walletHandler.checkPassword(walletPassword), 'incorrect walletPassword is given');
    const existingAccount = this.getAccount(account);
    check(existingAccount, `${toString(account)} does not exist`);
    if (newName && newName !== '') {
      existingAccount.name = newName;
      this.db.accounts.update(existingAccount.data);
      await this.saveDatabase();
    }
    this.logger.info(`successfully updated account(id=${existingAccount.id}) name to ${newName}`);
    return existingAccount;
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

  _defaultAccountName() {
    return `Account ${this.getAccounts().length + 1}`;
  }
}
