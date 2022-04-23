import { PoolContractConfig } from '@mystikonetwork/config';
import { Commitment, CommitmentStatus, Wallet } from '@mystikonetwork/database';
import { MerkleTree, toBN } from '@mystikonetwork/utils';
import BN from 'bn.js';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import {
  TransactionExecutor,
  TransactionQuote,
  TransactionQuoteOptions,
  TransactionResponse,
  TransactionSummary,
  TransferOptions,
  WithdrawOptions,
} from '../../../interface';
import { CommitmentUtils } from '../../../utils';
import { MystikoExecutor } from '../../executor';

const MAX_NUM_INPUTS = 2;

type ExecutionContext = {
  options: TransferOptions | WithdrawOptions;
  contractConfig: PoolContractConfig;
  wallet: Wallet;
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
    return this.getCommitments(options, config).then((commitments) =>
      CommitmentUtils.quote(options, config, commitments, MAX_NUM_INPUTS),
    );
  }

  public summary(
    options: TransferOptions | WithdrawOptions,
    config: PoolContractConfig,
  ): Promise<TransactionSummary> {
    return Promise.reject(new Error('not implemented'));
  }

  private getCommitments(
    options: TransactionQuoteOptions | TransferOptions | WithdrawOptions,
    contractConfig: PoolContractConfig,
  ): Promise<Commitment[]> {
    return this.context.accounts.find().then((accounts) =>
      this.context.commitments.findByContract({
        chainId: options.chainId,
        contractAddress: contractConfig.address,
        statuses: [CommitmentStatus.INCLUDED],
        shieldedAddresses: accounts.map((a) => a.shieldedAddress),
      }),
    );
  }

  private buildExecutionContext(
    options: TransferOptions | WithdrawOptions,
    contractConfig: PoolContractConfig,
  ): Promise<ExecutionContext> {
    return this.context.wallets
      .checkPassword(options.walletPassword)
      .then((wallet) =>
        this.getCommitments(options, contractConfig).then((commitments) => ({ wallet, commitments })),
      )
      .then(({ wallet, commitments }) => ({
        options,
        contractConfig,
        wallet,
        commitments,
      }));
  }

  private buildMerkleTree(context: ExecutionContext): Promise<MerkleTree> {
    const { options, contractConfig } = context;
    return this.context.commitments
      .findByContract({
        chainId: options.chainId,
        contractAddress: contractConfig.address,
        statuses: [CommitmentStatus.INCLUDED, CommitmentStatus.SPENT],
      })
      .then((commitments) => {
        const sorted = CommitmentUtils.sortByLeafIndex(commitments);
        const commitmentHashes: BN[] = [];
        for (let i = 0; i < sorted.length; i += 1) {
          const { leafIndex, encryptedNote, commitmentHash } = sorted[i];
          if (leafIndex === undefined || encryptedNote === undefined) {
            return createErrorPromise(
              `missing required data of commitment=${commitmentHash}`,
              MystikoErrorCode.MISSING_COMMITMENT_DATA,
            );
          }
          if (!toBN(leafIndex).eqn(i)) {
            return createErrorPromise(
              `leafIndex is not correct of commitment=${commitmentHash}`,
              MystikoErrorCode.CORRUPTED_COMMITMENT_DATA,
            );
          }
          commitmentHashes.push(toBN(commitmentHash));
        }
        return new MerkleTree(commitmentHashes);
      });
  }
}
