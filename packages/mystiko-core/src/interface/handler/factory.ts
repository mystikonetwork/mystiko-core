import { AccountHandler } from './account';
import { AssetHandler } from './asset';
import { ChainHandler } from './chain';
import { CommitmentHandler } from './commitment';
import { DepositHandler } from './deposit';
import { TransactionHandler } from './transaction';
import { WalletHandler } from './wallet';

export interface HandlerFactory<
  AC extends AccountHandler = AccountHandler,
  AS extends AssetHandler = AssetHandler,
  CH extends ChainHandler = ChainHandler,
  CM extends CommitmentHandler = CommitmentHandler,
  DP extends DepositHandler = DepositHandler,
  TX extends TransactionHandler = TransactionHandler,
  WA extends WalletHandler = WalletHandler,
> {
  createAccountHandler(): AC;
  createAssetHandler(): AS;
  createChainHandler(): CH;
  createCommitmentHandler(): CM;
  createDepositHandler(): DP;
  createTransactionHandler(): TX;
  createWalletHandler(): WA;
}
