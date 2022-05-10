import { AccountHandler } from './account';
import { AssetHandler } from './asset';
import { ChainHandler } from './chain';
import { CommitmentHandler } from './commitment';
import { ContractHandler } from './contract';
import { DepositHandler } from './deposit';
import { NullifierHandler } from './nullifier';
import { TransactionHandler } from './transaction';
import { WalletHandler } from './wallet';

export interface HandlerFactory<
  AC extends AccountHandler = AccountHandler,
  AS extends AssetHandler = AssetHandler,
  CH extends ChainHandler = ChainHandler,
  CO extends ContractHandler = ContractHandler,
  CM extends CommitmentHandler = CommitmentHandler,
  DP extends DepositHandler = DepositHandler,
  NL extends NullifierHandler = NullifierHandler,
  TX extends TransactionHandler = TransactionHandler,
  WA extends WalletHandler = WalletHandler,
> {
  createAccountHandler(): AC;
  createAssetHandler(): AS;
  createChainHandler(): CH;
  createContractHandler(): CO;
  createCommitmentHandler(): CM;
  createDepositHandler(): DP;
  createNullifierHandler(): NL;
  createTransactionHandler(): TX;
  createWalletHandler(): WA;
}
