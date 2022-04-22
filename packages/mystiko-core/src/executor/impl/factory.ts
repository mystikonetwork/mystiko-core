import { Contract } from '@mystikonetwork/database';
import { createError, MystikoErrorCode } from '../../error';
import {
  AssetExecutor,
  DepositExecutor,
  ExecutorFactory,
  MystikoContextInterface,
  TransactionExecutor,
} from '../../interface';
import { AssetExecutorV2, DepositExecutorV2, TransactionExecutorV2 } from './v2';

export class DefaultExecutorFactory implements ExecutorFactory {
  public context?: MystikoContextInterface;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getAssetExecutor(contract: Contract): AssetExecutor {
    if (this.context) {
      return new AssetExecutorV2(this.context);
    }
    throw createError('no context was set for DefaultExecutorFactory', MystikoErrorCode.NO_CONTEXT);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getDepositExecutor(contract: Contract): DepositExecutor {
    if (this.context) {
      return new DepositExecutorV2(this.context);
    }
    throw createError('no context was set for DefaultExecutorFactory', MystikoErrorCode.NO_CONTEXT);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getTransactionExecutor(contract: Contract): TransactionExecutor {
    if (this.context) {
      return new TransactionExecutorV2(this.context);
    }
    throw createError('no context was set for DefaultExecutorFactory', MystikoErrorCode.NO_CONTEXT);
  }
}
