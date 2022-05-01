import { hdkey } from 'ethereumjs-wallet';
import { Account, AccountStatus, AccountType, DatabaseQuery, Wallet } from '@mystikonetwork/database';
import { toBuff, toHexNoPrefix } from '@mystikonetwork/utils';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import { MystikoHandler } from '../../handler';
import { AccountHandler, AccountOptions, AccountUpdate, MystikoContextInterface } from '../../../interface';

export const DEFAULT_ACCOUNT_SCAN_SIZE = 10000;

export class AccountHandlerV2 extends MystikoHandler implements AccountHandler {
  constructor(context: MystikoContextInterface) {
    super(context);
    this.context.accounts = this;
  }

  public count(query?: DatabaseQuery<Account>): Promise<number> {
    return this.find(query).then((accounts) => accounts.length);
  }

  public create(walletPassword: string, options?: AccountOptions): Promise<Account> {
    return this.context.wallets
      .checkPassword(walletPassword)
      .then((wallet) => {
        if (!options || !options.name || options.name.length === 0) {
          return this.defaultAccountName().then((name) => ({ wallet, name }));
        }
        return { wallet, name: options.name };
      })
      .then(({ name, wallet }) =>
        this.createRawAccount(wallet, walletPassword, name, options?.secretKey, options?.scanSize),
      )
      .then(({ wallet, account }) => this.insertAccount(wallet, account, !options?.secretKey))
      .then((account) => {
        this.logger.info(`account address=${account.shieldedAddress} has been created successfully`);
        return account;
      });
  }

  public encrypt(oldWalletPassword: string, newWalletPassword: string): Promise<void> {
    return this.context.wallets
      .checkPassword(oldWalletPassword)
      .then(() => this.find())
      .then((accounts) =>
        Promise.all(
          accounts.map((account) => {
            const secretKey = account.secretKey(this.protocol, oldWalletPassword);
            return account.atomicUpdate((data) => {
              data.updatedAt = MystikoHandler.now();
              data.encryptedSecretKey = this.protocol.encryptSymmetric(newWalletPassword, secretKey);
              return data;
            });
          }),
        ),
      )
      .then(() => {});
  }

  public export(walletPassword: string, identifier: string): Promise<string> {
    return this.checkIdentifierAndPassword(identifier, walletPassword).then((account) =>
      account.secretKey(this.protocol, walletPassword),
    );
  }

  public find(query?: DatabaseQuery<Account>): Promise<Account[]> {
    return this.context.wallets.checkCurrent().then((wallet) => {
      const selector: any = query?.selector || {};
      selector.wallet = wallet.id;
      const newQuery = query ? { ...query, selector } : { selector };
      return this.db.accounts.find(newQuery).exec();
    });
  }

  public findOne(identifier: string): Promise<Account | null> {
    return this.context.wallets.checkCurrent().then((wallet) =>
      this.db.accounts
        .findOne({
          selector: {
            wallet: wallet.id,
            $or: [{ id: identifier }, { shieldedAddress: identifier }, { publicKey: identifier }],
          },
        })
        .exec(),
    );
  }

  public update(walletPassword: string, identifier: string, options: AccountUpdate): Promise<Account> {
    return this.checkIdentifierAndPassword(identifier, walletPassword).then((account) =>
      account.atomicUpdate((data) => {
        let hasUpdate = false;
        if (options.name && options.name.length > 0 && options.name !== data.name) {
          hasUpdate = true;
          data.name = options.name;
        }
        if (options.scanSize && options.scanSize > 0 && options.scanSize !== data.scanSize) {
          hasUpdate = true;
          data.scanSize = options.scanSize;
        }
        if (options.status && options.status !== data.status) {
          hasUpdate = true;
          data.status = options.status;
        }
        if (hasUpdate) {
          data.updatedAt = MystikoHandler.now();
        }
        return data;
      }),
    );
  }

  private defaultAccountName(): Promise<string> {
    return this.count().then((count) => `Account ${count + 1}`);
  }

  private generateSecretKeys(wallet: Wallet, walletPassword: string): { skVerify: Buffer; skEnc: Buffer } {
    const hdWallet = hdkey.fromMasterSeed(toBuff(wallet.masterSeed(this.protocol, walletPassword)));
    let skVerify: Buffer;
    if (wallet.accountNonce === 0) {
      skVerify = hdWallet.getWallet().getPrivateKey();
    } else {
      skVerify = hdWallet.deriveChild(wallet.accountNonce).getWallet().getPrivateKey();
    }
    const skEnc = hdWallet
      .deriveChild(wallet.accountNonce + 1)
      .getWallet()
      .getPrivateKey();
    return { skVerify, skEnc };
  }

  private createRawAccount(
    wallet: Wallet,
    walletPassword: string,
    name: string,
    rawSecretKey?: string,
    scanSize?: number,
  ): { wallet: Wallet; account: AccountType } {
    let secretKeys: { skVerify: Buffer; skEnc: Buffer };
    if (rawSecretKey) {
      secretKeys = this.protocol.separatedSecretKeys(toBuff(rawSecretKey));
    } else {
      secretKeys = this.generateSecretKeys(wallet, walletPassword);
    }
    const pkVerify = this.protocol.publicKeyForVerification(secretKeys.skVerify);
    const pkEnc = this.protocol.publicKeyForEncryption(secretKeys.skEnc);
    const secretKey = this.protocol.fullSecretKey(secretKeys.skVerify, secretKeys.skEnc);
    const now = MystikoHandler.now();
    const account: AccountType = {
      id: MystikoHandler.generateId(),
      createdAt: now,
      updatedAt: now,
      name,
      shieldedAddress: this.protocol.shieldedAddress(pkVerify, pkEnc),
      publicKey: toHexNoPrefix(this.protocol.fullPublicKey(pkVerify, pkEnc)),
      encryptedSecretKey: this.protocol.encryptSymmetric(walletPassword, toHexNoPrefix(secretKey)),
      status: AccountStatus.CREATED,
      scanSize: scanSize || DEFAULT_ACCOUNT_SCAN_SIZE,
      wallet: wallet.id,
    };
    return { wallet, account };
  }

  private insertAccount(wallet: Wallet, account: AccountType, updateNonce: boolean): Promise<Account> {
    return this.findOne(account.shieldedAddress).then((existingAccount) => {
      if (existingAccount != null) {
        return createErrorPromise(
          `duplicate account with same Mystiko Address ${account.shieldedAddress}`,
          MystikoErrorCode.DUPLICATE_ACCOUNT,
        );
      }
      if (updateNonce) {
        return wallet
          .atomicUpdate((data) => {
            data.updatedAt = MystikoHandler.now();
            data.accountNonce = wallet.accountNonce + 2;
            return data;
          })
          .then(() => this.db.accounts.insert(account));
      }
      return this.db.accounts.insert(account);
    });
  }

  private checkIdentifierAndPassword(identifier: string, walletPassword: string): Promise<Account> {
    return this.context.wallets.checkPassword(walletPassword).then(() =>
      this.findOne(identifier).then((account) => {
        if (account === null) {
          return createErrorPromise(
            `non existing account ${identifier}`,
            MystikoErrorCode.NON_EXISTING_ACCOUNT,
          );
        }
        return account;
      }),
    );
  }
}
