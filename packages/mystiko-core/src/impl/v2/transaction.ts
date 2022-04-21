import { DatabaseQuery, Transaction } from '@mystikonetwork/database';
import { MystikoContext } from '../../context';
import { MystikoHandler } from '../../handler';
import {
  TransactionQuoteOptions,
  TransactionHandler,
  TransactionQuery,
  TransactionQuote,
  TransactionSummary,
  TransferOptions,
  WithdrawOptions,
} from '../../interface';

export class TransactionHandlerV2 extends MystikoHandler implements TransactionHandler {
  constructor(context: MystikoContext) {
    super(context);
    this.context.transactions = this;
  }

  public count(query?: DatabaseQuery<Transaction>): Promise<number> {
    return Promise.reject(new Error('not implemented'));
  }

  public create(options: TransferOptions | WithdrawOptions): Promise<Transaction> {
    return Promise.reject(new Error('not implemented'));
  }

  public find(query?: DatabaseQuery<Transaction>): Promise<Transaction[]> {
    return Promise.reject(new Error('not implemented'));
  }

  public findOne(query: TransactionQuery): Promise<Transaction | null> {
    return Promise.reject(new Error('not implemented'));
  }

  public quote(options: TransactionQuoteOptions): Promise<TransactionQuote> {
    return Promise.reject(new Error('not implemented'));
  }

  public summary(options: TransferOptions | WithdrawOptions): Promise<TransactionSummary> {
    return Promise.reject(new Error('not implemented'));
  }

  public update(tx: Transaction): Promise<Transaction> {
    return Promise.reject(new Error('not implemented'));
  }
}
