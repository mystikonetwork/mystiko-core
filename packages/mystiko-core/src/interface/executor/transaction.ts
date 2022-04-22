import { PoolContractConfig } from '@mystikonetwork/config';
import {
  TransactionQuote,
  TransactionQuoteOptions,
  TransactionResponse,
  TransactionSummary,
  TransferOptions,
  WithdrawOptions,
} from '../handler';

export interface TransactionExecutor<
  T = TransferOptions,
  W = WithdrawOptions,
  QO = TransactionQuoteOptions,
  Q = TransactionQuote,
  S = TransactionSummary,
  R = TransactionResponse,
> {
  execute(options: T | W, config: PoolContractConfig): Promise<R>;
  quote(options: QO, config: PoolContractConfig): Promise<Q>;
  summary(options: T | W, config: PoolContractConfig): Promise<S>;
}
