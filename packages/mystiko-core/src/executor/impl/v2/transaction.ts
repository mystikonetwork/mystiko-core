import { ChainConfig, PoolContractConfig } from '@mystikonetwork/config';
import {
  Commitment,
  CommitmentStatus,
  CommitmentType,
  Transaction,
  TransactionEnum,
  TransactionStatus,
  Wallet,
} from '@mystikonetwork/database';
import { checkSigner } from '@mystikonetwork/ethers';
import { MystikoProtocolV2 } from '@mystikonetwork/protocol';
import { errorMessage, fromDecimals, MerkleTree, toBN, toDecimals, toHex } from '@mystikonetwork/utils';
import BN from 'bn.js';
import { isEthereumAddress } from 'class-validator';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import { MystikoHandler } from '../../../handler';
import {
  TransactionExecutor,
  TransactionOptions,
  TransactionQuote,
  TransactionQuoteOptions,
  TransactionResponse,
  TransactionSummary,
  TransactionUpdate,
} from '../../../interface';
import { CommitmentUtils } from '../../../utils';
import { MystikoExecutor } from '../../executor';

const MAX_NUM_INPUTS = 2;

type ExecutionContext = {
  options: TransactionOptions;
  contractConfig: PoolContractConfig;
  chainConfig: ChainConfig;
  wallet: Wallet;
  commitments: Commitment[];
  selectedCommitments: Commitment[];
  quote: TransactionQuote;
  amount: BN;
  publicAmount: BN;
  rollupFee: BN;
  gasRelayerFee: BN;
  outputCommitments?: Commitment[];
};

type ExecutionContextWithTransaction = ExecutionContext & {
  transaction: Transaction;
};

export class TransactionExecutorV2 extends MystikoExecutor implements TransactionExecutor {
  public execute(options: TransactionOptions, config: PoolContractConfig): Promise<TransactionResponse> {
    return this.buildExecutionContext(options, config)
      .then((executionContext) => this.validateOptions(executionContext))
      .then((executionContext) => this.validatePoolBalance(executionContext))
      .then((executionContext) => this.validateSigner(executionContext))
      .then((executionContext) => this.createOutputCommitments(executionContext))
      .then((executionContext) => this.createTransaction(executionContext))
      .then((executionContext) => ({
        transaction: executionContext.transaction,
        transactionPromise: Promise.resolve(executionContext.transaction),
      }));
  }

  public quote(options: TransactionQuoteOptions, config: PoolContractConfig): Promise<TransactionQuote> {
    return this.getCommitments(options, config).then((commitments) =>
      CommitmentUtils.quote(options, config, commitments, MAX_NUM_INPUTS),
    );
  }

  public summary(options: TransactionOptions, config: PoolContractConfig): Promise<TransactionSummary> {
    return this.buildExecutionContext(options, config)
      .then((executionContext) => this.validateOptions(executionContext))
      .then((executionContext) => {
        const { quote, amount, publicAmount, rollupFee, gasRelayerFee } = executionContext;
        const previousBalance = quote.balance;
        const rollupFeeAmount = fromDecimals(rollupFee, config.assetDecimals);
        const gasRelayerFeeAmount = fromDecimals(gasRelayerFee, config.assetDecimals);
        let withdrawingAmount = 0;
        let transferringAmount = 0;
        if (options.type === TransactionEnum.WITHDRAW) {
          withdrawingAmount = fromDecimals(
            publicAmount.sub(rollupFee).sub(gasRelayerFee),
            config.assetDecimals,
          );
        }
        if (options.type === TransactionEnum.TRANSFER) {
          transferringAmount = fromDecimals(amount.sub(rollupFee).sub(gasRelayerFee), config.assetDecimals);
        }
        const newBalance = previousBalance - withdrawingAmount - transferringAmount;
        return {
          previousBalance,
          newBalance,
          withdrawingAmount,
          transferringAmount,
          rollupFeeAmount,
          rollupFeeAssetSymbol: config.assetSymbol,
          gasRelayerFeeAmount,
          gasRelayerFeeAssetSymbol: config.assetSymbol,
          gasRelayerAddress: options.gasRelayerAddress,
        };
      });
  }

  private getCommitments(
    options: TransactionQuoteOptions | TransactionOptions,
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
    options: TransactionOptions,
    contractConfig: PoolContractConfig,
    checkPassword = false,
  ): Promise<ExecutionContext> {
    const walletPromise: Promise<Wallet> = checkPassword
      ? this.context.wallets.checkPassword(options.walletPassword)
      : this.context.wallets.checkCurrent();
    return walletPromise
      .then((wallet) =>
        this.getCommitments(options, contractConfig).then((commitments) => ({ wallet, commitments })),
      )
      .then(({ wallet, commitments }) => {
        const chainConfig = this.config.getChainConfig(options.chainId);
        if (!chainConfig) {
          return createErrorPromise(
            `failed to get chain id=${options.chainId} configuration`,
            MystikoErrorCode.NON_EXISTING_CHAIN,
          );
        }
        const quote = CommitmentUtils.quote(options, contractConfig, commitments, MAX_NUM_INPUTS);
        let amount = toBN(0);
        if (options.amount && quote.valid) {
          amount = toDecimals(options.amount, contractConfig.assetDecimals);
        }
        let publicAmount = toBN(0);
        if (options.publicAmount && quote.valid) {
          publicAmount = toDecimals(options.publicAmount, contractConfig.assetDecimals);
        }
        let rollupFee = toBN(0);
        if (options.rollupFee && quote.valid) {
          rollupFee = toDecimals(options.rollupFee, contractConfig.assetDecimals).muln(quote.numOfSplits);
        }
        let gasRelayerFee = toBN(0);
        if (options.gasRelayerFee && quote.valid) {
          gasRelayerFee = toDecimals(options.gasRelayerFee, contractConfig.assetDecimals);
        }
        let selectedCommitments: Commitment[] = [];
        if (quote.valid) {
          const spendingAmount = options.type === TransactionEnum.TRANSFER ? amount : publicAmount;
          selectedCommitments = CommitmentUtils.select(commitments, MAX_NUM_INPUTS, spendingAmount);
        }
        return {
          options,
          contractConfig,
          chainConfig,
          wallet,
          commitments,
          selectedCommitments,
          quote,
          amount,
          publicAmount,
          rollupFee,
          gasRelayerFee,
        };
      });
  }

  private validateOptions(executionContext: ExecutionContext): Promise<ExecutionContext> {
    const {
      options,
      contractConfig,
      quote,
      selectedCommitments,
      amount,
      publicAmount,
      rollupFee,
      gasRelayerFee,
    } = executionContext;
    const spentAmount = options.type === TransactionEnum.TRANSFER ? amount : publicAmount;
    if (!quote.valid) {
      return createErrorPromise(
        quote.invalidReason || 'invalid transfer/withdraw options',
        MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
      );
    }
    if (spentAmount.lte(rollupFee.add(gasRelayerFee))) {
      return createErrorPromise(
        'rollup fee or gas relayer fee is too high',
        MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
      );
    }
    if (rollupFee.lt(contractConfig.minRollupFee.muln(quote.numOfSplits))) {
      return createErrorPromise(
        'rollupFee is too small to pay rollup service',
        MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
      );
    }
    if (gasRelayerFee.gtn(0) && (!options.gasRelayerAddress || !options.gasRelayerEndpoint)) {
      return createErrorPromise(
        'must specify gas relayer address and endpoint when gas relayer fee is not 0',
        MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
      );
    }
    if (
      options.type === TransactionEnum.WITHDRAW &&
      (!options.publicAddress || !isEthereumAddress(options.publicAddress))
    ) {
      return createErrorPromise(
        'invalid ethereum address for withdrawing',
        MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
      );
    }
    if (
      options.type === TransactionEnum.TRANSFER &&
      (!options.shieldedAddress || !this.protocol.isShieldedAddress(options.shieldedAddress))
    ) {
      return createErrorPromise(
        'invalid mystiko address for transferring',
        MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
      );
    }
    if (!isEthereumAddress(options.gasRelayerAddress)) {
      return createErrorPromise(
        'invalid ethereum address for gas relayer',
        MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
      );
    }
    if (selectedCommitments.length === 0) {
      return createErrorPromise(
        'cannot find any private asset to withdraw or transfer',
        MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
      );
    }
    return Promise.resolve(executionContext);
  }

  private validatePoolBalance(executionContext: ExecutionContext): Promise<ExecutionContext> {
    const { options, contractConfig, publicAmount } = executionContext;
    if (publicAmount.gtn(0)) {
      return this.context.executors
        .getAssetExecutor()
        .balance({
          chainId: options.chainId,
          assetAddress: contractConfig.assetAddress,
          assetSymbol: contractConfig.assetSymbol,
          assetDecimals: contractConfig.assetDecimals,
          address: contractConfig.address,
        })
        .then((poolBalance) => {
          if (toBN(poolBalance).lt(publicAmount)) {
            return createErrorPromise(
              `insufficient pool balance of contract=${contractConfig.address}`,
              MystikoErrorCode.INSUFFICIENT_POOL_BALANCE,
            );
          }
          return executionContext;
        });
    }
    return Promise.resolve(executionContext);
  }

  private validateSigner(executionContext: ExecutionContext): Promise<ExecutionContext> {
    const { options } = executionContext;
    return checkSigner(options.signer, options.chainId, this.config).then(() => executionContext);
  }

  private createOutputCommitments(executionContext: ExecutionContext): Promise<ExecutionContext> {
    const { options, selectedCommitments, amount, publicAmount, rollupFee, gasRelayerFee } = executionContext;
    if (selectedCommitments.length > 0) {
      const inputSum = CommitmentUtils.sum(selectedCommitments);
      const commitmentPromises: Promise<Commitment>[] = [];
      let remainingAmount = toBN(0);
      if (options.type === TransactionEnum.TRANSFER && options.shieldedAddress) {
        remainingAmount = inputSum.sub(amount);
        const transferringAmount = amount.sub(rollupFee).sub(gasRelayerFee);
        if (transferringAmount.gtn(0)) {
          commitmentPromises.push(
            this.createOutputCommitment(executionContext, options.shieldedAddress, transferringAmount),
          );
        }
      } else {
        remainingAmount = inputSum.sub(publicAmount);
      }
      if (remainingAmount.gtn(0)) {
        const inputCommitment = selectedCommitments[0];
        if (inputCommitment.shieldedAddress) {
          commitmentPromises.push(
            this.createOutputCommitment(executionContext, inputCommitment.shieldedAddress, remainingAmount),
          );
        }
      }
      return Promise.all(commitmentPromises).then((outputCommitments) => ({
        ...executionContext,
        outputCommitments,
      }));
    }
    return Promise.resolve(executionContext);
  }

  private createOutputCommitment(
    executionContext: ExecutionContext,
    shieldedAddress: string,
    amount: BN,
  ): Promise<Commitment> {
    const { options, contractConfig } = executionContext;
    return (this.protocol as MystikoProtocolV2)
      .commitmentWithShieldedAddress(shieldedAddress, amount)
      .then((commitmentInfo) => {
        const { commitmentHash, privateNote } = commitmentInfo;
        const now = MystikoHandler.now();
        const rawCommitment: CommitmentType = {
          id: MystikoHandler.generateId(),
          createdAt: now,
          updatedAt: now,
          chainId: options.chainId,
          contractAddress: contractConfig.address,
          assetSymbol: contractConfig.assetSymbol,
          assetDecimals: contractConfig.assetDecimals,
          assetAddress: contractConfig.assetAddress,
          bridgeType: options.bridgeType,
          status: CommitmentStatus.INIT,
          commitmentHash: commitmentHash.toString(),
          rollupFeeAmount: toDecimals(options.rollupFee || 0, contractConfig.assetDecimals).toString(),
          encryptedNote: toHex(privateNote),
          amount: amount.toString(),
          shieldedAddress,
          srcChainId: options.chainId,
          srcChainContractAddress: contractConfig.address,
          srcAssetSymbol: contractConfig.assetSymbol,
          srcAssetDecimals: contractConfig.assetDecimals,
          srcAssetAddress: contractConfig.assetAddress,
        };
        return this.db.commitments.insert(rawCommitment);
      });
  }

  private createTransaction(executionContext: ExecutionContext): Promise<ExecutionContextWithTransaction> {
    const {
      wallet,
      options,
      selectedCommitments,
      contractConfig,
      amount,
      publicAmount,
      rollupFee,
      gasRelayerFee,
      outputCommitments,
    } = executionContext;
    const now = MystikoHandler.now();
    let receivingAmount = toBN(0);
    let receivingPublicAmount = toBN(0);
    if (options.type === TransactionEnum.TRANSFER) {
      receivingAmount = amount.sub(rollupFee).sub(gasRelayerFee);
    }
    if (options.type === TransactionEnum.WITHDRAW) {
      receivingPublicAmount = publicAmount.sub(rollupFee).sub(gasRelayerFee);
    }
    return this.db.transactions
      .insert({
        id: MystikoHandler.generateId(),
        createdAt: now,
        updatedAt: now,
        chainId: options.chainId,
        contractAddress: contractConfig.address,
        assetSymbol: contractConfig.assetSymbol,
        assetAddress: contractConfig.assetAddress,
        assetDecimals: contractConfig.assetDecimals,
        inputCommitments: selectedCommitments.map((c) => c.id),
        outputCommitments: outputCommitments ? outputCommitments.map((c) => c.id) : [],
        amount: receivingAmount.toString(),
        publicAmount: receivingPublicAmount.toString(),
        rollupFeeAmount: rollupFee.toString(),
        gasRelayerFeeAmount: rollupFee.toString(),
        gasRelayerAddress: options.gasRelayerAddress,
        shieldedAddress: options.shieldedAddress,
        publicAddress: options.publicAddress,
        status: TransactionStatus.INIT,
        type: options.type,
        wallet: wallet.id,
      })
      .then((transaction) => ({ ...executionContext, transaction }));
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

  private updateTransactionStatus(
    options: TransactionOptions,
    transaction: Transaction,
    newStatus: TransactionStatus,
    extraData: TransactionUpdate,
  ): Promise<Transaction> {
    const oldStatus = transaction.status as TransactionStatus;
    const wrappedData = extraData || {};
    wrappedData.status = newStatus;
    return this.context.transactions.update(transaction.id, extraData).then((newTransaction) => {
      if (options.statusCallback) {
        try {
          options.statusCallback(newTransaction, oldStatus, newStatus);
        } catch (error) {
          this.logger.warn(`status callback execution failed: ${errorMessage(error)}`);
        }
      }
      return newTransaction;
    });
  }
}
