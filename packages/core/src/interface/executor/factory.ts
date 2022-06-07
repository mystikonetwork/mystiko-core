import { DepositContractConfig, PoolContractConfig } from '@mystikonetwork/config';
import { AssetExecutor } from './asset';
import { CommitmentExecutor } from './commitment';
import { DepositExecutor } from './deposit';
import { EventExecutor } from './event';
import { TransactionExecutor } from './transaction';

export interface ExecutorFactory<
  A extends AssetExecutor = AssetExecutor,
  C extends CommitmentExecutor = CommitmentExecutor,
  D extends DepositExecutor = DepositExecutor,
  E extends EventExecutor = EventExecutor,
  T extends TransactionExecutor = TransactionExecutor,
> {
  getAssetExecutor(): A;
  getCommitmentExecutor(): C;
  getEventExecutor(): E;
  getDepositExecutor(config: DepositContractConfig): D;
  getTransactionExecutor(config: PoolContractConfig): T;
}
