import { PoolContractConfig } from '@mystikonetwork/config';
import {
  TransactionOptions,
  TransactionQuote,
  TransactionQuoteOptions,
  TransactionResponse,
  TransactionSummary,
} from '../handler';

export interface TransactionExecutor<
  T = TransactionOptions,
  QO = TransactionQuoteOptions,
  Q = TransactionQuote,
  S = TransactionSummary,
  R = TransactionResponse,
> {
  execute(options: T, config: PoolContractConfig): Promise<R>;
  quote(options: QO, config: PoolContractConfig): Promise<Q>;
  summary(options: T, config: PoolContractConfig): Promise<S>;
}
