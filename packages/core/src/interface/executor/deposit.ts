import { DepositContractConfig } from '@mystikonetwork/config';
import { Deposit } from '@mystikonetwork/database';
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
  execute(options: D, config: DepositContractConfig): Promise<R>;
  quote(options: QO, config: DepositContractConfig): Promise<Q>;
  summary(options: D, config: DepositContractConfig): Promise<S>;
  fixStatus(deposit: Deposit): Promise<Deposit>;
}
