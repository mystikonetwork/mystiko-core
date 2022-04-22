import {
  DepositOptions,
  DepositQuote,
  DepositQuoteOptions,
  DepositResponse,
  DepositSummary,
} from '../handler';

export interface DepositExecutor<
  D = DepositOptions,
  QO = DepositQuoteOptions,
  Q = DepositQuote,
  S = DepositSummary,
  R = DepositResponse,
> {
  execute(options: D): Promise<R>;
  quote(options: QO): Promise<Q>;
  summary(options: D): Promise<S>;
}
