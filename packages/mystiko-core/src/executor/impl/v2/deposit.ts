import {
  DepositExecutor,
  DepositOptions,
  DepositQuote,
  DepositQuoteOptions,
  DepositResponse,
  DepositSummary,
} from '../../../interface';
import { MystikoExecutor } from '../../executor';

export class DepositExecutorV2 extends MystikoExecutor implements DepositExecutor {
  public execute(options: DepositOptions): Promise<DepositResponse> {
    return Promise.reject(new Error('not implemented'));
  }

  public quote(options: DepositQuoteOptions): Promise<DepositQuote> {
    return Promise.reject(new Error('not implemented'));
  }

  public summary(options: DepositOptions): Promise<DepositSummary> {
    return Promise.reject(new Error('not implemented'));
  }
}
