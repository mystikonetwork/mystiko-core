import { Handler } from './handler.js';
import { ID_KEY, Wallet } from '../model/';
import { check } from '../utils.js';
import rootLogger from '../logger';

/**
 * @class WalletHandler
 * @extends Handler
 * @desc handler class for Wallet related business logic
 * @param {module:mystiko/db.WrappedDb} db instance of {@link module:mystiko/db.WrappedDb}.
 * @param {MystikoConfig} config instance of {@link MystikoConfig}.
 */
export class WalletHandler extends Handler {
  constructor(db, config) {
    super(db, config);
    this.logger = rootLogger.getLogger('WalletHandler');
  }

  /**
   * @desc create a new wallet instance with the given master seed and password.
   * Only one instance of {@link Wallet} is required in your application. Multiple calls on this
   * method will make previously created instances to be ignored. Therefore, please use
   * {@link WalletHandler#getCurrentWallet} or {@link WalletHandler#checkCurrentWallet} to check whether
   * there is an existing wallet instance, before you call this function.
   * @param {string} masterSeed master seed of the wallet, it is normally generated from the mnemonic wordlist.
   * @param {string} walletPassword password of the wallet, this will be used to check wallet login and
   * encryption sensitive data stored in the wallet, such as secret keys.
   * @returns {Promise<Wallet>} a promise of {@link Wallet} instance.
   */
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
    this.logger.info(`successfully created a wallet(id=${wallet.id})`);
    return wallet;
  }

  /**
   * @desc Get current existing {@link Wallet} instance if it does exist.
   * @returns {Wallet|undefined} the instance if it exists, otherwise it returns undefined.
   */
  getCurrentWallet() {
    const results = this.db.wallets.chain().find().simplesort(ID_KEY, { desc: true }).data();
    if (results.length > 0) {
      return new Wallet(results[0]);
    }
    return undefined;
  }

  /**
   * @desc Check whether there is an existing {@link Wallet} instance, if not, it raises error.
   * @returns {Wallet} the {@link Wallet} instance.
   * @throws {Error} if there is no existing {@link Wallet} instance.
   */
  checkCurrentWallet() {
    const wallet = this.getCurrentWallet();
    check(wallet, 'no existing wallet in database');
    return wallet;
  }

  /**
   * @desc Get wallet instance by wallet id.
   * @param {number} id the id of wallet.
   * @returns {Wallet|undefined} an instance of {@link Wallet} if the given id exists, otherwise it returns undefined.
   */
  getWalletById(id) {
    check(typeof id === 'number', 'id should be instance of number');
    const rawWallet = this.db.wallets.findOne({ [ID_KEY]: id });
    if (rawWallet) {
      return new Wallet(rawWallet);
    }
    return undefined;
  }

  /**
   * @desc check the given password matches current wallet's password. We use the checksum method to check the
   * correctness of the input password.
   * @param {string} password the password to be checked.
   * @returns {boolean} true if it matches the record, otherwise it returns false.
   */
  checkPassword(password) {
    check(typeof password === 'string', 'password should be instance of string');
    const wallet = this.checkCurrentWallet();
    const hashedPassword = this.protocol.checkSum(password);
    return wallet.hashedPassword === hashedPassword;
  }

  /**
   * Update the wallet's password to the new password. Before you call this function,
   * please first call {@link AccountHandler#updateAccountKeys} to update all account's encrypted keys associated
   * with this wallet. And then call this function.
   * @param {string} oldPassword the old password.
   * @param {string} newPassword the new password.
   * @returns {Promise<boolean>} true if it updates the records successfully, otherwise it returns false if the
   * given old password does not match stored value.
   */
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
      this.logger.info(`successfully updated wallet(id=${wallet.id}) password`);
      return true;
    }
    return false;
  }

  /**
   * @desc export the wallet's master seed in plain text.
   * @param {string} walletPassword the password of wallet.
   * @returns {string} master seed in plain text.
   * @throws {Error} the given password is incorrect.
   */
  exportMasterSeed(walletPassword) {
    check(this.checkPassword(walletPassword), 'incorrect wallet password');
    const wallet = this.checkCurrentWallet();
    return this.protocol.decryptSymmetric(walletPassword, wallet.encryptedMasterSeed);
  }
}
