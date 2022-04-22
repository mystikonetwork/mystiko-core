import { DepositContractConfig, PoolContractConfig } from '@mystikonetwork/config';
import { AssetExecutor } from './asset';
import { DepositExecutor } from './deposit';
import { TransactionExecutor } from './transaction';

export interface ExecutorFactory {
  getAssetExecutor(): AssetExecutor;
  getDepositExecutor(config: DepositContractConfig): DepositExecutor;
  getTransactionExecutor(config: PoolContractConfig): TransactionExecutor;
}
