import { DepositContractConfig, PoolContractConfig } from '@mystikonetwork/config';
import { AssetExecutor } from './asset';
import { CommitmentExecutor } from './commitment';
import { DepositExecutor } from './deposit';
import { TransactionExecutor } from './transaction';

export interface ExecutorFactory<
  A extends AssetExecutor = AssetExecutor,
  C extends CommitmentExecutor = CommitmentExecutor,
  D extends DepositExecutor = DepositExecutor,
  T extends TransactionExecutor = TransactionExecutor,
> {
  getAssetExecutor(): A;
  getCommitmentExecutor(): C;
  getDepositExecutor(config: DepositContractConfig): D;
  getTransactionExecutor(config: PoolContractConfig): T;
}
