import { Wallet, WalletType } from '@mystikonetwork/database';
import { WalletHandler, WalletOptions } from '../../interface';
import { createErrorPromise, MystikoErrorCode } from '../../error';
import { MystikoHandler } from '../../handler';
import { MystikoContext } from '../../context';

export class WalletHandlerV2 extends MystikoHandler implements WalletHandler {
  public static readonly PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

  public static readonly PASSWORD_HINT =
    'the password must contain ' +
    'at least one upper case letter, ' +
    'one lower case letter, ' +
    'one number digit, ' +
    'one special character in [#?!@$%^&*-], ' +
    'and the length should be as least 8';

  constructor(context: MystikoContext) {
    super(context);
    this.context.wallets = this;
  }

  public checkCurrent(): Promise<Wallet> {
    return this.current().then((wallet) => {
      if (wallet) {
        return wallet;
      }
      return createErrorPromise('no existing wallet in database', MystikoErrorCode.NON_EXISTING_WALLET);
    });
  }

  public checkPassword(password: string): Promise<Wallet> {
    return this.current().then((wallet) => {
      if (wallet == null) {
        return createErrorPromise('no existing wallet in database', MystikoErrorCode.NON_EXISTING_WALLET);
      }
      if (this.checkPasswordHash(password, wallet)) {
        return wallet;
      }
      return createErrorPromise('wrong wallet password', MystikoErrorCode.WRONG_PASSWORD);
    });
  }

  public create(options: WalletOptions): Promise<Wallet> {
    if (options.masterSeed.length < 1) {
      return createErrorPromise('masterSeed cannot be empty string', MystikoErrorCode.INVALID_MASTER_SEED);
    }
    if (!WalletHandlerV2.validatePassword(options.password)) {
      return createErrorPromise(WalletHandlerV2.PASSWORD_HINT, MystikoErrorCode.INVALID_PASSWORD);
    }
    const now = MystikoHandler.now();
    const rawWallet: WalletType = {
      id: MystikoHandler.generateId(),
      createdAt: now,
      updatedAt: now,
      hashedPassword: this.protocol.checkSum(options.password),
      encryptedMasterSeed: this.protocol.encryptSymmetric(options.password, options.masterSeed),
      accountNonce: 0,
    };
    return this.db.wallets.insert(rawWallet).then((wallet) => {
      this.logger.info(`successfully created a wallet(id=${wallet.id})`);
      return wallet;
    });
  }

  public current(): Promise<Wallet | null> {
    return this.db.wallets.findOne({ selector: {}, sort: [{ createdAt: 'desc' }] }).exec();
  }

  public exportMasterSeed(password: string): Promise<string> {
    return this.checkPassword(password).then((wallet) => wallet.masterSeed(this.protocol, password));
  }

  public updatePassword(oldPassword: string, newPassword: string): Promise<Wallet> {
    return this.checkPassword(oldPassword).then((wallet) => {
      if (!WalletHandlerV2.validatePassword(newPassword)) {
        return createErrorPromise(WalletHandlerV2.PASSWORD_HINT, MystikoErrorCode.INVALID_PASSWORD);
      }
      const masterSeed = this.protocol.decryptSymmetric(oldPassword, wallet.encryptedMasterSeed);
      return wallet.atomicUpdate((data) => {
        data.encryptedMasterSeed = this.protocol.encryptSymmetric(newPassword, masterSeed);
        data.hashedPassword = this.protocol.checkSum(newPassword);
        data.updatedAt = MystikoHandler.now();
        return data;
      });
    });
  }

  private checkPasswordHash(password: string, wallet: Wallet | null): boolean {
    return wallet != null && this.protocol.checkSum(password) === wallet.hashedPassword;
  }

  private static validatePassword(password: string): boolean {
    return password.match(WalletHandlerV2.PASSWORD_REGEX) != null;
  }
}
