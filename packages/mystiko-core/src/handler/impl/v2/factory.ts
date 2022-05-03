import { HandlerFactory, MystikoContextInterface } from '../../../interface';
import { AccountHandlerV2 } from './account';
import { AssetHandlerV2 } from './asset';
import { ChainHandlerV2 } from './chain';
import { CommitmentHandlerV2 } from './commitment';
import { ContractHandlerV2 } from './contract';
import { DepositHandlerV2 } from './deposit';
import { TransactionHandlerV2 } from './transaction';
import { WalletHandlerV2 } from './wallet';

type HandlerFactoryV2Interface = HandlerFactory<
  AccountHandlerV2,
  AssetHandlerV2,
  ChainHandlerV2,
  ContractHandlerV2,
  CommitmentHandlerV2,
  DepositHandlerV2,
  TransactionHandlerV2,
  WalletHandlerV2
>;

export class HandlerFactoryV2 implements HandlerFactoryV2Interface {
  private readonly context: MystikoContextInterface;

  constructor(context: MystikoContextInterface) {
    this.context = context;
  }

  public createAccountHandler(): AccountHandlerV2 {
    return new AccountHandlerV2(this.context);
  }

  public createAssetHandler(): AssetHandlerV2 {
    return new AssetHandlerV2(this.context);
  }

  public createChainHandler(): ChainHandlerV2 {
    return new ChainHandlerV2(this.context);
  }

  public createContractHandler(): ContractHandlerV2 {
    return new ContractHandlerV2(this.context);
  }

  public createCommitmentHandler(): CommitmentHandlerV2 {
    return new CommitmentHandlerV2(this.context);
  }

  public createDepositHandler(): DepositHandlerV2 {
    return new DepositHandlerV2(this.context);
  }

  public createTransactionHandler(): TransactionHandlerV2 {
    return new TransactionHandlerV2(this.context);
  }

  public createWalletHandler(): WalletHandlerV2 {
    return new WalletHandlerV2(this.context);
  }
}
