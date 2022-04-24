import { DepositContractConfig, PoolContractConfig } from '@mystikonetwork/config';
import { AssetExecutor } from './asset';
import { DepositExecutor } from './deposit';
import { TransactionExecutor } from './transaction';

export interface ExecutorFactory<
  A extends AssetExecutor = AssetExecutor,
  D extends DepositExecutor = DepositExecutor,
  T extends TransactionExecutor = TransactionExecutor,
> {
  getAssetExecutor(): A;
  getDepositExecutor(config: DepositContractConfig): D;
  getTransactionExecutor(config: PoolContractConfig): T;
}
