import { DepositContractConfig, PoolContractConfig } from '@mystikonetwork/config';
import { ExecutorFactory, MystikoContextInterface } from '../../../interface';
import { AssetExecutorV2 } from './asset';
import { CommitmentExecutorV2 } from './commitment';
import { DepositExecutorV2 } from './deposit';
import { EventExecutorV2 } from './event';
import { IndexerExecutorV2 } from './indexer';
import { TransactionExecutorV2 } from './transaction';

type ExecutorFactoryV2Interface = ExecutorFactory<
  AssetExecutorV2,
  CommitmentExecutorV2,
  DepositExecutorV2,
  EventExecutorV2,
  IndexerExecutorV2,
  TransactionExecutorV2
>;

export class ExecutorFactoryV2 implements ExecutorFactoryV2Interface {
  protected context: MystikoContextInterface;

  private assetExecutor?: AssetExecutorV2;

  private commitmentExecutor?: CommitmentExecutorV2;

  private depositExecutor?: DepositExecutorV2;

  private eventExecutor?: EventExecutorV2;

  private indexerExecutor?: IndexerExecutorV2;

  private transactionExecutor?: TransactionExecutorV2;

  constructor(context: MystikoContextInterface) {
    this.context = context;
    this.context.executors = this;
  }

  public getAssetExecutor(): AssetExecutorV2 {
    if (!this.assetExecutor) {
      this.assetExecutor = new AssetExecutorV2(this.context);
    }
    return this.assetExecutor;
  }

  public getCommitmentExecutor(): CommitmentExecutorV2 {
    if (!this.commitmentExecutor) {
      this.commitmentExecutor = new CommitmentExecutorV2(this.context);
    }
    return this.commitmentExecutor;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getDepositExecutor(config: DepositContractConfig): DepositExecutorV2 {
    if (!this.depositExecutor) {
      this.depositExecutor = new DepositExecutorV2(this.context);
    }
    return this.depositExecutor;
  }

  public getEventExecutor(): EventExecutorV2 {
    if (!this.eventExecutor) {
      this.eventExecutor = new EventExecutorV2(this.context);
    }
    return this.eventExecutor;
  }

  public getIndexerExecutor(): IndexerExecutorV2 | undefined {
    if (this.context.config.indexer) {
      if (!this.indexerExecutor) {
        this.indexerExecutor = new IndexerExecutorV2(this.context, this.context.config.indexer);
      }
    }
    return this.indexerExecutor;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getTransactionExecutor(config: PoolContractConfig): TransactionExecutorV2 {
    if (!this.transactionExecutor) {
      this.transactionExecutor = new TransactionExecutorV2(this.context);
    }
    return this.transactionExecutor;
  }
}
