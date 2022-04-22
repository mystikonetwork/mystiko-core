import { PoolContractConfig } from '@mystikonetwork/config';
import {
  TransactionExecutor,
  TransactionQuote,
  TransactionQuoteOptions,
  TransactionResponse,
  TransactionSummary,
  TransferOptions,
  WithdrawOptions,
} from '../../../interface';
import { MystikoExecutor } from '../../executor';

export class TransactionExecutorV2 extends MystikoExecutor implements TransactionExecutor {
  public execute(
    options: TransferOptions | WithdrawOptions,
    config: PoolContractConfig,
  ): Promise<TransactionResponse> {
    return Promise.reject(new Error('not implemented'));
  }

  public quote(options: TransactionQuoteOptions, config: PoolContractConfig): Promise<TransactionQuote> {
    return Promise.reject(new Error('not implemented'));
  }

  public summary(
    options: TransferOptions | WithdrawOptions,
    config: PoolContractConfig,
  ): Promise<TransactionSummary> {
    return Promise.reject(new Error('not implemented'));
  }
}
