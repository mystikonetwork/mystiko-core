import { Contract } from '@mystikonetwork/database';
import { AssetExecutor } from './asset';
import { DepositExecutor } from './deposit';
import { TransactionExecutor } from './transaction';

export interface ExecutorFactory {
  getAssetExecutor(contract: Contract): AssetExecutor;
  getDepositExecutor(contract: Contract): DepositExecutor;
  getTransactionExecutor(contract: Contract): TransactionExecutor;
}
