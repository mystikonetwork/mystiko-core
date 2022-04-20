import { hdkey } from 'ethereumjs-wallet';
import { MystikoConfig } from '@mystikonetwork/config';
import { Account, AccountType, DatabaseQuery, MystikoDatabase, Wallet } from '@mystikonetwork/database';
import { MystikoProtocol } from '@mystikonetwork/protocol';
import { toBuff, toHexNoPrefix } from '@mystikonetwork/utils';
import { AccountHandler, AccountOptions } from './common';
import { createErrorPromise, MystikoErrorCode } from '../error';
import { MystikoHandler } from '../handler';
import { WalletHandlerV2 } from '../wallet';

export class AccountHandlerV2 extends MystikoHandler implements AccountHandler {
  private readonly walletHandler: WalletHandlerV2;

  constructor(
    walletHandler: WalletHandlerV2,
    config: MystikoConfig,
    db: MystikoDatabase,
    protocol: MystikoProtocol,
  ) {
    super(config, db, protocol);
    this.walletHandler = walletHandler;
  }

  public count(query?: DatabaseQuery<Account>): Promise<number> {
    return this.find(query).then((accounts) => accounts.length);
  }

  public create(options: AccountOptions, walletPassword: string): Promise<Account> {
    return this.walletHandler
      .checkPassword(walletPassword)
      .then((wallet) => {
        if (!options.name) {
          return this.defaultAccountName().then((name) => ({ wallet, name }));
        }
        return { wallet, name: options.name };
      })
      .then(({ name, wallet }) => this.createRawAccount(wallet, walletPassword, name, options.secretKey))
      .then(({ wallet, account }) => this.insertAccount(wallet, account, !options.secretKey));
  }

  public encrypt(oldWalletPassword: string, newWalletPassword: string): Promise<void> {
    return this.walletHandler
      .checkPassword(newWalletPassword)
      .then(() => this.find())
      .then((accounts) =>
        Promise.all(
          accounts.map((account) => {
            const secretKey = account.secretKey(this.protocol, oldWalletPassword);
            return account.update({
              $set: {
                updatedAt: MystikoHandler.now(),
                encryptedSecretKey: this.protocol.encryptSymmetric(newWalletPassword, secretKey),
              },
            });
          }),
        ),
      )
      .then(() => {});
  }

  public export(identifier: string, walletPassword: string): Promise<string> {
    return this.checkIdentifierAndPassword(identifier, walletPassword).then((account) =>
      account.secretKey(this.protocol, walletPassword),
    );
  }

  public find(query?: DatabaseQuery<Account>): Promise<Account[]> {
    return this.walletHandler.checkCurrent().then((wallet) => {
      const selector: any = query?.selector || {};
      selector.wallet = wallet.id;
      const newQuery = query ? { ...query, selector } : { selector };
      return this.db.accounts.find(newQuery).exec();
    });
  }

  public findOne(identifier: string): Promise<Account | null> {
    return this.db.accounts
      .findOne(identifier)
      .exec()
      .then((account) => {
        if (account === null) {
          return this.db.accounts.findOne({ selector: { identifier } }).exec();
        }
        return account;
      });
  }

  public update(identifier: string, options: AccountOptions, walletPassword: string): Promise<Account> {
    return this.checkIdentifierAndPassword(identifier, walletPassword).then((account) => {
      if (options.name && options.name.length > 0) {
        return account.update({ $set: { updatedAt: MystikoHandler.now(), name: options.name } });
      }
      return account;
    });
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
          .update({
            $set: {
              updatedAt: MystikoHandler.now(),
              accountNonce: wallet.accountNonce + 2,
            },
          })
          .then(() => this.db.accounts.insert(account));
      }
      return this.db.accounts.insert(account);
    });
  }

  private checkIdentifierAndPassword(identifier: string, walletPassword: string): Promise<Account> {
    return this.walletHandler.checkPassword(walletPassword).then(() =>
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
