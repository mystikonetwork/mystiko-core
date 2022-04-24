import { MystikoConfig } from '@mystikonetwork/config';
import { MystikoDatabase } from '@mystikonetwork/database';
import { ProviderPool } from '@mystikonetwork/ethers';
import { MystikoProtocol } from '@mystikonetwork/protocol';
import { ExecutorFactory } from '../executor';
import {
  AccountHandler,
  AssetHandler,
  ChainHandler,
  CommitmentHandler,
  DepositHandler,
  TransactionHandler,
  WalletHandler,
} from '../handler';

export interface MystikoContextInterface<
  A extends AccountHandler = AccountHandler,
  AS extends AssetHandler = AssetHandler,
  CH extends ChainHandler = ChainHandler,
  CM extends CommitmentHandler = CommitmentHandler,
  D extends DepositHandler = DepositHandler,
  T extends TransactionHandler = TransactionHandler,
  W extends WalletHandler = WalletHandler,
  P extends MystikoProtocol = MystikoProtocol,
> {
  get config(): MystikoConfig;
  set config(conf: MystikoConfig);
  get db(): MystikoDatabase;
  set db(database: MystikoDatabase);
  get protocol(): P;
  set protocol(p: P);
  get accounts(): A;
  set accounts(handler: A);
  get assets(): AS;
  set assets(handler: AS);
  get chains(): CH;
  set chains(handler: CH);
  get commitments(): CM;
  set commitments(handler: CM);
  get deposits(): D;
  set deposits(handler: D);
  get transactions(): T;
  set transactions(handler: T);
  get wallets(): W;
  set wallets(handler: W);
  get executors(): ExecutorFactory;
  set executors(factory: ExecutorFactory);
  get providers(): ProviderPool;
  set providers(pool: ProviderPool);
}
