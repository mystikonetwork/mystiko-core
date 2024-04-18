import { DepositContractConfig, PoolContractConfig } from '@mystikonetwork/config';
import { AssetExecutor } from './asset';
import { CommitmentExecutor } from './commitment';
import { DepositExecutor } from './deposit';
import { EventExecutor } from './event';
import { MerkleTreeExecutor } from './merkle';
import { SequencerExecutor } from './sequencer';
import { PackerExecutor } from './packer';
import { TransactionExecutor } from './transaction';

export interface ExecutorFactory<
  A extends AssetExecutor = AssetExecutor,
  C extends CommitmentExecutor = CommitmentExecutor,
  D extends DepositExecutor = DepositExecutor,
  E extends EventExecutor = EventExecutor,
  S extends SequencerExecutor = SequencerExecutor,
  P extends PackerExecutor = PackerExecutor,
  T extends TransactionExecutor = TransactionExecutor,
  M extends MerkleTreeExecutor = MerkleTreeExecutor,
> {
  getAssetExecutor(): A;
  getCommitmentExecutor(): C;
  getEventExecutor(): E;
  getDepositExecutor(config: DepositContractConfig): D;
  getSequencerExecutor(): S | undefined;
  getTransactionExecutor(config: PoolContractConfig): T;
  getPackerExecutor(): P | undefined;
  getMerkleTreeExecutor(): M;
}
