import { PoolContractConfig } from '@mystikonetwork/config';
import { Transaction } from '@mystikonetwork/database';
import {
  TransactionOptions,
  TransactionQuoteOptions,
  TransactionQuoteWithRelayers,
  TransactionResponse,
  TransactionSummary,
} from '../handler';

export interface TransactionExecutor<
  T = TransactionOptions,
  QO = TransactionQuoteOptions,
  Q = TransactionQuoteWithRelayers,
  S = TransactionSummary,
  R = TransactionResponse,
> {
  execute(options: T, config: PoolContractConfig): Promise<R>;
  quote(options: QO, config: PoolContractConfig): Promise<Q>;
  summary(options: T, config: PoolContractConfig): Promise<S>;
  fixStatus(transaction: Transaction): Promise<Transaction>;
}
