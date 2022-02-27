import { hdkey } from 'ethereumjs-wallet';
import { MystikoConfig } from '@mystiko/config';
import { check, toBuff, toHexNoPrefix, toString, logger as rootLogger } from '@mystiko/utils';
import { ID_KEY, Account } from '../model';
import { Handler } from './handler';
import { WalletHandler } from './walletHandler';
import { MystikoDatabase } from '../database';

/**
 * @class AccountHandler
 * @extends Handler
 * @param {WalletHandler} walletHandler instance of {@link WalletHandler}.
 * @param {MystikoDatabase} db instance of {@link MystikoDatabase}.
 * @param {MystikoConfig} config instance of {@link MystikoConfig}.
 * @desc handler class for Account related business logic
 */
export class AccountHandler extends Handler {
  private readonly walletHandler: WalletHandler;

  constructor(walletHandler: WalletHandler, db: MystikoDatabase, config?: MystikoConfig) {
    super(db, config);
    this.walletHandler = walletHandler;
    this.logger = rootLogger.getLogger('AccountHandler');
  }

  /**
   * @desc get all current managed {@link Account} as an array from the database.
   * @returns {Account[]} an array of {@link Account}.
   */
  public getAccounts(): Account[] {
    const wallet = this.walletHandler.checkCurrentWallet();
    const rawAccounts = this.db.accounts.find({ walletId: wallet.id });
    return rawAccounts.map((account) => new Account(account));
  }

  /**
   * @desc get {@link Account} based on the given query.
   * @param {number | string | Account} query if the query is a number, it searches the database by using the query as id.
   * If the query is a string, and it is a valid shielded address format, it searches the database by using the
   * query as {@link Account#shieldedAddress}. If the query is instance of {@link Account},
   * it just returns that account.
   * @returns {Account | undefined}
   */
  public getAccount(query: number | string | Account): Account | undefined {
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
   * @param {number | string | Account} account account id or shielded address or instance of {@link Account}.
   * @returns {string} a full secret key in plain text.
   * @throws {Error} if the given wallet password is incorrect.
   */
  public exportAccountSecretKey(walletPassword: string, account: number | string | Account): string {
    check(this.walletHandler.checkPassword(walletPassword), 'incorrect walletPassword is given');
    const wrappedAccount = this.getAccount(account);
    if (wrappedAccount) {
      if (wrappedAccount.encryptedEncSecretKey && wrappedAccount.encryptedVerifySecretKey) {
        const skVerify = this.protocol.decryptSymmetric(
          walletPassword,
          wrappedAccount.encryptedVerifySecretKey,
        );
        const skEnc = this.protocol.decryptSymmetric(walletPassword, wrappedAccount.encryptedEncSecretKey);
        return toHexNoPrefix(this.protocol.fullSecretKey(toBuff(skVerify), toBuff(skEnc)));
      }
      throw new Error(`${account.toString()} does contain full encrypted keys`);
    }
    throw new Error(`${account.toString()} does not exist`);
  }

  /**
   * @desc add a new account with the given account name. The generated secret keys are based on the
   * master seed from the wallet.
   * @param {string} walletPassword the password of the current running wallet.
   * @param {string | undefined} [accountName] name of account.
   * @returns {Promise<Account>} promise of an instance of {@link Account}.
   * @throws {Error} if the given wallet password is incorrect.
   */
  public async addAccount(walletPassword: string, accountName?: string): Promise<Account> {
    check(this.walletHandler.checkPassword(walletPassword), 'incorrect walletPassword is given');
    let wrappedAccountName: string;
    if (!accountName || accountName === '') {
      wrappedAccountName = this.defaultAccountName();
    } else {
      wrappedAccountName = accountName;
    }
    const wallet = this.walletHandler.checkCurrentWallet();
    if (!wallet.encryptedMasterSeed) {
      throw new Error('wallet does not have encryptedMasterSeed in database');
    }
    const walletMasterSeed = this.protocol.decryptSymmetric(walletPassword, wallet.encryptedMasterSeed);
    const hdWallet = hdkey.fromMasterSeed(toBuff(walletMasterSeed));
    let skVerify: Buffer;
    const accountNonce = wallet.accountNonce || 0;
    if (accountNonce === 0) {
      skVerify = hdWallet.getWallet().getPrivateKey();
    } else {
      skVerify = hdWallet.deriveChild(accountNonce).getWallet().getPrivateKey();
    }
    const skEnc = hdWallet
      .deriveChild(accountNonce + 1)
      .getWallet()
      .getPrivateKey();
    const account = this.createAccount(walletPassword, wrappedAccountName, skVerify, skEnc);
    this.db.accounts.insert(account.data);
    wallet.accountNonce = accountNonce + 2;
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
  public async importAccountFromSecretKey(
    walletPassword: string,
    accountName: string,
    secretKey: string,
  ): Promise<Account> {
    check(this.walletHandler.checkPassword(walletPassword), 'incorrect walletPassword is given');
    let wrappedAccountName: string;
    if (accountName === '') {
      wrappedAccountName = this.defaultAccountName();
    } else {
      wrappedAccountName = accountName;
    }
    const secretKeys = this.protocol.separatedSecretKeys(toBuff(secretKey));
    const verifySecretKey = secretKeys.skVerify;
    const encSecretKey = secretKeys.skEnc;
    const account = this.createAccount(walletPassword, wrappedAccountName, verifySecretKey, encSecretKey);
    if (account.shieldedAddress) {
      const existingAccount = this.getAccount(account.shieldedAddress);
      if (existingAccount) {
        this.logger.info(
          `there is an existing account(id=${existingAccount.id})` +
            'matches this secret key, so updating the existing account',
        );
        existingAccount.name = wrappedAccountName;
        this.db.accounts.update(existingAccount.data);
        await this.saveDatabase();
      } else {
        this.db.accounts.insert(account.data);
        await this.saveDatabase();
        this.logger.info(`successfully imported an new account(id=${account.id})`);
      }
    }
    return account;
  }

  /**
   * @desc remove account from wallet.
   * @param {string} walletPassword the password of the current running wallet.
   * @param {number | string | Account} account account id or shielded address or instance of {@link Account}.
   * @returns {Promise<Account>} promise of the removed account.
   * @throws {Error} if the given account does not exist or the given wallet password is incorrect.
   */
  public async removeAccount(walletPassword: string, account: number | string | Account): Promise<Account> {
    check(this.walletHandler.checkPassword(walletPassword), 'incorrect walletPassword is given');
    const wrappedAccount = this.getAccount(account);
    if (wrappedAccount) {
      this.db.accounts.remove(wrappedAccount.data);
      await this.saveDatabase();
      this.logger.info(`successfully removed account(id=${wrappedAccount.id})`);
      return wrappedAccount;
    }
    throw new Error(`${account.toString()} does not exist`);
  }

  /**
   * @desc update the encrypted secret keys with the new password. You should call this function
   * before you update the password of your wallet.
   * @param {string} oldPassword the old password.
   * @param {string} newPassword the new password.
   * @returns {Promise<void>}
   */
  public async updateAccountKeys(oldPassword: string, newPassword: string): Promise<void> {
    check(this.walletHandler.checkPassword(oldPassword), 'incorrect walletPassword is given');
    this.getAccounts().forEach((account) => {
      this.logger.info(`updating account(id=${account.id}) encrypted secret keys`);
      if (!account.encryptedVerifySecretKey || !account.encryptedEncSecretKey) {
        throw new Error(`Account(id=${account.id}) does not contain encrypted secret keys`);
      }
      const verifySecretKey = this.protocol.decryptSymmetric(oldPassword, account.encryptedVerifySecretKey);
      const encSecretKey = this.protocol.decryptSymmetric(oldPassword, account.encryptedEncSecretKey);
      const newAccount = new Account(account.data);
      newAccount.encryptedVerifySecretKey = this.protocol.encryptSymmetric(newPassword, verifySecretKey);
      newAccount.encryptedEncSecretKey = this.protocol.encryptSymmetric(newPassword, encSecretKey);
      this.db.accounts.update(newAccount.data);
    });
    await this.saveDatabase();
    this.logger.info('successfully updated all accounts encrypted secret keys');
  }

  /**
   * @desc update the name of the given account.
   * @param {string} walletPassword the password of the current running wallet.
   * @param {number | string | Account} account account id or shielded address or instance of {@link Account}.
   * @param {string | undefined} newName new name of the account.
   * @returns {Promise<Account>} the updated instance of {@link Account}.
   * @throws {Error} if the given wallet password is incorrect.
   */
  public async updateAccountName(
    walletPassword: string,
    account: number | string | Account,
    newName?: string,
  ): Promise<Account> {
    check(this.walletHandler.checkPassword(walletPassword), 'incorrect walletPassword is given');
    const existingAccount = this.getAccount(account);
    if (existingAccount) {
      if (newName && newName !== '') {
        existingAccount.name = newName;
        this.db.accounts.update(existingAccount.data);
        await this.saveDatabase();
        this.logger.info(`successfully updated account(id=${existingAccount.id}) name to ${newName}`);
      }
      return existingAccount;
    }
    throw new Error(`${toString(account)} does not exist`);
  }

  private createAccount(
    walletPassword: string,
    accountName: string,
    skVerify: Buffer,
    skEnc: Buffer,
  ): Account {
    const wallet = this.walletHandler.checkCurrentWallet();
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

  private defaultAccountName(): string {
    return `Account ${this.getAccounts().length + 1}`;
  }
}
