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
  execute(options: T | W): Promise<R>;
  quote(options: QO): Promise<Q>;
  summary(options: T | W): Promise<S>;
}
