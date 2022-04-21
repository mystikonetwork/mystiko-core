import { MystikoConfig } from '@mystikonetwork/config';
import { MystikoDatabase } from '@mystikonetwork/database';
import { MystikoProtocol } from '@mystikonetwork/protocol';
import {
  AccountHandler,
  CommitmentHandler,
  DepositHandler,
  TransactionHandler,
  WalletHandler,
} from './interface';
import { createError, MystikoErrorCode } from './error';

export class MystikoContext<
  A extends AccountHandler = AccountHandler,
  C extends CommitmentHandler = CommitmentHandler,
  D extends DepositHandler = DepositHandler,
  T extends TransactionHandler = TransactionHandler,
  W extends WalletHandler = WalletHandler,
  P extends MystikoProtocol = MystikoProtocol,
> {
  private accountHandler?: A;

  private commitmentHandler?: C;

  private depositHandler?: D;

  private transactionHandler?: T;

  private walletHandler?: W;

  public config: MystikoConfig;

  public db: MystikoDatabase;

  public protocol: P;

  constructor(config: MystikoConfig, db: MystikoDatabase, protocol: P) {
    this.config = config;
    this.db = db;
    this.protocol = protocol;
  }

  public get accounts(): A {
    if (!this.accountHandler) {
      throw createError('account handler has not been set', MystikoErrorCode.NO_HANDLER);
    }
    return this.accountHandler;
  }

  public set accounts(accountHandler: A) {
    this.accountHandler = accountHandler;
  }

  public get commitments(): C {
    if (!this.commitmentHandler) {
      throw createError('commitment handler has not been set', MystikoErrorCode.NO_HANDLER);
    }
    return this.commitmentHandler;
  }

  public set commitments(commitmentHandler: C) {
    this.commitmentHandler = commitmentHandler;
  }

  public get deposits(): D {
    if (!this.depositHandler) {
      throw createError('deposit handler has not been set', MystikoErrorCode.NO_HANDLER);
    }
    return this.depositHandler;
  }

  public set deposits(depositHandler: D) {
    this.depositHandler = depositHandler;
  }

  public get transactions(): T {
    if (!this.transactionHandler) {
      throw createError('transaction handler has not been set', MystikoErrorCode.NO_HANDLER);
    }
    return this.transactionHandler;
  }

  public set transactions(transactionHandler: T) {
    this.transactionHandler = transactionHandler;
  }

  public get wallets(): W {
    if (!this.walletHandler) {
      throw createError('wallet handler has not been set', MystikoErrorCode.NO_HANDLER);
    }
    return this.walletHandler;
  }

  public set wallets(walletHandler: W) {
    this.walletHandler = walletHandler;
  }
}
