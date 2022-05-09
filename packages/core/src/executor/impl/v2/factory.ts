import { DepositContractConfig, PoolContractConfig } from '@mystikonetwork/config';
import { ExecutorFactory, MystikoContextInterface } from '../../../interface';
import { AssetExecutorV2 } from './asset';
import { CommitmentExecutorV2 } from './commitment';
import { DepositExecutorV2 } from './deposit';
import { TransactionExecutorV2 } from './transaction';

type ExecutorFactoryV2Interface = ExecutorFactory<
  AssetExecutorV2,
  CommitmentExecutorV2,
  DepositExecutorV2,
  TransactionExecutorV2
>;

export class ExecutorFactoryV2 implements ExecutorFactoryV2Interface {
  protected context: MystikoContextInterface;

  constructor(context: MystikoContextInterface) {
    this.context = context;
    this.context.executors = this;
  }

  public getAssetExecutor(): AssetExecutorV2 {
    return new AssetExecutorV2(this.context);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getDepositExecutor(config: DepositContractConfig): DepositExecutorV2 {
    return new DepositExecutorV2(this.context);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getTransactionExecutor(config: PoolContractConfig): TransactionExecutorV2 {
    return new TransactionExecutorV2(this.context);
  }

  public getCommitmentExecutor(): CommitmentExecutorV2 {
    return new CommitmentExecutorV2(this.context);
  }
}
