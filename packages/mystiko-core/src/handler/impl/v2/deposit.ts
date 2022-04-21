import { DatabaseQuery, Deposit } from '@mystikonetwork/database';
import { MystikoContext } from '../../../context';
import { MystikoHandler } from '../../handler';
import {
  DepositHandler,
  DepositOptions,
  DepositQuery,
  DepositQuote,
  DepositQuoteOptions,
  DepositSummary,
} from '../../../interface/handler';

export class DepositHandlerV2 extends MystikoHandler implements DepositHandler {
  constructor(context: MystikoContext) {
    super(context);
    this.context.deposits = this;
  }

  public count(query?: DatabaseQuery<Deposit>): Promise<number> {
    return Promise.reject(new Error('not implemented'));
  }

  public create(options: DepositOptions): Promise<Deposit> {
    return Promise.reject(new Error('not implemented'));
  }

  public find(query?: DatabaseQuery<Deposit>): Promise<Deposit[]> {
    return Promise.reject(new Error('not implemented'));
  }

  public findOne(query: DepositQuery): Promise<Deposit | null> {
    return Promise.reject(new Error('not implemented'));
  }

  public quote(options: DepositQuoteOptions): Promise<DepositQuote> {
    return Promise.reject(new Error('not implemented'));
  }

  public update(deposit: Deposit): Promise<Deposit> {
    return Promise.reject(new Error('not implemented'));
  }

  public summary(options: DepositOptions): Promise<DepositSummary> {
    return Promise.reject(new Error('not implemented'));
  }
}
