import { PoolContractConfig } from '@mystikonetwork/config';
import { Account, Commitment, CommitmentStatus, Wallet } from '@mystikonetwork/database';
import {
  TransactionExecutor,
  TransactionQuote,
  TransactionQuoteOptions,
  TransactionResponse,
  TransactionSummary,
  TransferOptions,
  WithdrawOptions,
} from '../../../interface';
import { MystikoExecutor } from '../../executor';

type ExecutionContext = {
  options: TransferOptions | WithdrawOptions;
  contractConfig: PoolContractConfig;
  wallet: Wallet;
  accounts: Account[];
  commitments: Commitment[];
};

export class TransactionExecutorV2 extends MystikoExecutor implements TransactionExecutor {
  public execute(
    options: TransferOptions | WithdrawOptions,
    config: PoolContractConfig,
  ): Promise<TransactionResponse> {
    return Promise.reject(new Error('not implemented'));
  }

  public quote(options: TransactionQuoteOptions, config: PoolContractConfig): Promise<TransactionQuote> {
    return Promise.reject(new Error('not implemented'));
  }

  public summary(
    options: TransferOptions | WithdrawOptions,
    config: PoolContractConfig,
  ): Promise<TransactionSummary> {
    return Promise.reject(new Error('not implemented'));
  }

  private buildExecutionContext(
    options: TransferOptions | WithdrawOptions,
    contractConfig: PoolContractConfig,
  ): Promise<ExecutionContext> {
    return this.context.wallets
      .checkPassword(options.walletPassword)
      .then((wallet) => this.context.accounts.find().then((accounts) => ({ wallet, accounts })))
      .then(({ wallet, accounts }) =>
        this.context.commitments
          .findByAssetAndBridge({
            chainId: options.chainId,
            assetSymbol: options.assetSymbol,
            bridgeType: options.bridgeType,
            statuses: [CommitmentStatus.INCLUDED],
            shieldedAddresses: accounts.map((a) => a.shieldedAddress),
          })
          .then((commitments) => ({ wallet, accounts, commitments })),
      )
      .then(({ wallet, accounts, commitments }) => ({
        options,
        contractConfig,
        wallet,
        accounts,
        commitments,
      }));
  }
}
