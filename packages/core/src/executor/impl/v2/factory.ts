import { DepositContractConfig, PoolContractConfig } from '@mystikonetwork/config';
import * as sequencer from '@mystikonetwork/sequencer-client';
import { ExecutorFactory, MystikoContextInterface } from '../../../interface';
import { AssetExecutorV2 } from './asset';
import { CommitmentExecutorV2 } from './commitment';
import { DepositExecutorV2 } from './deposit';
import { EventExecutorV2 } from './event';
import { SequencerExecutorV2 } from './sequencer';
import { PackerExecutorV2 } from './packer';
import { TransactionExecutorV2 } from './transaction';

type ExecutorFactoryV2Interface = ExecutorFactory<
  AssetExecutorV2,
  CommitmentExecutorV2,
  DepositExecutorV2,
  EventExecutorV2,
  SequencerExecutorV2,
  PackerExecutorV2,
  TransactionExecutorV2
>;

export class ExecutorFactoryV2 implements ExecutorFactoryV2Interface {
  protected context: MystikoContextInterface;

  private assetExecutor?: AssetExecutorV2;

  private commitmentExecutor?: CommitmentExecutorV2;

  private depositExecutor?: DepositExecutorV2;

  private eventExecutor?: EventExecutorV2;

  private sequencerExecutor?: SequencerExecutorV2;

  private packerExecutor?: PackerExecutorV2;

  private transactionExecutor?: TransactionExecutorV2;

  private sequencerClient?: sequencer.v1.SequencerClient;

  constructor(context: MystikoContextInterface, sequencerClient?: sequencer.v1.SequencerClient) {
    this.context = context;
    this.context.executors = this;
    this.sequencerClient = sequencerClient;
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

  public getSequencerExecutor(): SequencerExecutorV2 | undefined {
    if (this.context.config.sequencer && this.sequencerClient) {
      if (!this.sequencerExecutor) {
        this.sequencerExecutor = new SequencerExecutorV2(this.context, this.sequencerClient);
      }
    }
    return this.sequencerExecutor;
  }

  public getPackerExecutor(): PackerExecutorV2 | undefined {
    if (this.context.config.packer) {
      if (!this.packerExecutor) {
        this.packerExecutor = new PackerExecutorV2(this.context);
      }
    }
    return this.packerExecutor;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getTransactionExecutor(config: PoolContractConfig): TransactionExecutorV2 {
    if (!this.transactionExecutor) {
      this.transactionExecutor = new TransactionExecutorV2(this.context);
    }
    return this.transactionExecutor;
  }
}
