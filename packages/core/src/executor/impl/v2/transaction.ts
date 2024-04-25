import {
  ChainConfig,
  CircuitConfig,
  CircuitType,
  MAIN_ASSET_ADDRESS,
  PoolContractConfig,
} from '@mystikonetwork/config';
import { CommitmentPool, ICommitmentPool } from '@mystikonetwork/contracts-abi';
import {
  Account,
  Commitment,
  CommitmentStatus,
  CommitmentType,
  Transaction,
  TransactionEnum,
  TransactionStatus,
  Wallet,
} from '@mystikonetwork/database';
import { ECIES } from '@mystikonetwork/ecies';
import { checkSigner } from '@mystikonetwork/ethers';
import { JobTypeEnum, RegisterInfo as RawGasRelayerInfo } from '@mystikonetwork/gas-relayer-config';
import { MerkleTree } from '@mystikonetwork/merkle';
import { CommitmentOutput, MystikoProtocolV2 } from '@mystikonetwork/protocol';
import {
  errorMessage,
  fromDecimals,
  readCompressedFile,
  readFile,
  toBN,
  toBuff,
  toDecimals,
  toHex,
  waitTransaction,
  waitTransactionHash,
} from '@mystikonetwork/utils';
import { ZKProof } from '@mystikonetwork/zkp';
import BN from 'bn.js';
import { isEthereumAddress, isURL } from 'class-validator';
import { ethers } from 'ethers';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import { MystikoHandler } from '../../../handler';
import {
  GasRelayerInfo,
  TransactionExecutor,
  TransactionOptions,
  TransactionProgressListener,
  TransactionQuote,
  TransactionQuoteOptions,
  TransactionQuoteWithRelayers,
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
  quote: TransactionQuoteWithRelayers;
  amount: BN;
  publicAmount: BN;
  rollupFee: BN;
  gasRelayerFee: BN;
  outputCommitments?: Array<{ commitment: Commitment; info: CommitmentOutput }>;
  etherContract: CommitmentPool;
  circuitConfig: CircuitConfig;
};

type ExecutionContextWithTransaction = ExecutionContext & {
  transaction: Transaction;
};

type ExecutionContextWithProof = ExecutionContextWithTransaction & {
  numInputs: number;
  numOutputs: number;
  outputEncryptedNotes: Buffer[];
  proof: ZKProof;
  randomEtherWallet: ethers.Wallet;
  numOfAuditors: number;
  randomAuditingSecretKey: BN;
};

type ExecutionContextWithRequest = ExecutionContextWithProof & {
  request: ICommitmentPool.TransactRequestStruct;
};

type CommitmentUpdate = {
  commitment: Commitment;
  status?: CommitmentStatus;
  creationTransactionHash?: string;
  spentTransactionHash?: string;
};

type RemoteContractConfig = {
  minRollupFee: BN;
};

type StaticAssets = {
  zkProgram: Buffer;
  zkProvingKey: Buffer;
  zkAbi: string;
  zkVerifyingKey: string;
};

const DEFAULT_WAIT_TIMEOUT_MS = 300000;

export const DEFAULT_GAS_RELAYER_WAITING_TIMEOUT_MS = 600000;

export class TransactionExecutorV2 extends MystikoExecutor implements TransactionExecutor {
  public execute(options: TransactionOptions, config: PoolContractConfig): Promise<TransactionResponse> {
    return this.buildExecutionContext(options, config, true)
      .then((executionContext) => this.validateOptions(executionContext))
      .then((executionContext) => this.validatePoolBalance(executionContext))
      .then((executionContext) => this.validateSigner(executionContext))
      .then((executionContext) => this.createOutputCommitments(executionContext))
      .then((executionContext) => this.createTransaction(executionContext))
      .then((executionContext) => ({
        transaction: executionContext.transaction,
        transactionPromise: this.executeTransaction(executionContext),
      }));
  }

  public async quote(
    options: TransactionQuoteOptions,
    config: PoolContractConfig,
  ): Promise<TransactionQuoteWithRelayers> {
    const { minRollupFee } = await this.fetchRemoteContractConfig(options, config);
    const commitments = await this.getCommitments(options, config);
    const quote = CommitmentUtils.quote(
      options,
      {
        assetSymbol: config.assetSymbol,
        assetDecimals: config.assetDecimals,
        minRollupFee,
        disabled: config.disabled,
      },
      commitments,
      MAX_NUM_INPUTS,
    );
    let quoteWithGasRelayers: TransactionQuoteWithRelayers = { ...quote, gasRelayers: [] };
    if (options.useGasRelayers) {
      quoteWithGasRelayers = await this.getRegisteredRelayers(options, config, quote);
    }
    const circuitConfig = TransactionExecutorV2.getCircuitConfig(
      quoteWithGasRelayers.numOfInputs,
      quoteWithGasRelayers.numOfSplits,
      config,
    );
    if (circuitConfig) {
      quoteWithGasRelayers = {
        ...quoteWithGasRelayers,
        merkleTreeUrl: this.context.executors
          .getMerkleTreeExecutor()
          .getUrl({ chainId: options.chainId, contractAddress: config.address }),
        zkProgramUrl: circuitConfig.programFile[0],
        zkProvingKeyUrl: circuitConfig.provingKeyFile[0],
        zkVerifyingKeyUrl: circuitConfig.verifyingKeyFile[0],
        zkAbiUrl: circuitConfig.abiFile[0],
      };
    }
    return quoteWithGasRelayers;
  }

  public summary(options: TransactionOptions, config: PoolContractConfig): Promise<TransactionSummary> {
    return this.buildExecutionContext(options, config)
      .then((executionContext) => this.validateOptions(executionContext))
      .then((executionContext) => {
        const { quote, amount, publicAmount, rollupFee, gasRelayerFee } = executionContext;
        const previousBalance = quote.balance;
        let newBalance = toDecimals(previousBalance, config.assetDecimals);
        const rollupFeeAmount = fromDecimals(rollupFee, config.assetDecimals);
        const gasRelayerFeeAmount = fromDecimals(gasRelayerFee, config.assetDecimals);
        let withdrawingAmount = 0;
        let transferringAmount = 0;
        if (options.type === TransactionEnum.WITHDRAW) {
          withdrawingAmount = fromDecimals(
            publicAmount.sub(rollupFee).sub(gasRelayerFee),
            config.assetDecimals,
          );
          newBalance = newBalance.sub(publicAmount);
        }
        if (options.type === TransactionEnum.TRANSFER) {
          transferringAmount = fromDecimals(amount.sub(rollupFee).sub(gasRelayerFee), config.assetDecimals);
          newBalance = newBalance.sub(amount);
        }
        return {
          previousBalance,
          newBalance: fromDecimals(newBalance, config.assetDecimals),
          assetSymbol: config.assetSymbol,
          recipient: options.shieldedAddress || options.publicAddress || '',
          withdrawingAmount,
          transferringAmount,
          rollupFeeAmount,
          rollupFeeAssetSymbol: config.assetSymbol,
          gasRelayerFeeAmount,
          gasRelayerFeeAssetSymbol: config.assetSymbol,
          gasRelayerAddress: options.gasRelayerInfo?.address,
        };
      });
  }

  public async fixStatus(transaction: Transaction): Promise<Transaction> {
    const provider = await this.context.providers.checkProvider(transaction.chainId);
    const inputCommitments = await this.context.commitments.find({
      selector: { id: { $in: transaction.inputCommitments } },
    });
    let outputCommitments: Commitment[] = [];
    if (transaction.outputCommitments && transaction.outputCommitments.length > 0) {
      outputCommitments = await this.context.commitments.find({
        selector: { id: { $in: transaction.outputCommitments } },
      });
    }
    const etherContract = this.context.contractConnector.connect<CommitmentPool>(
      'CommitmentPool',
      transaction.contractAddress,
      provider,
    );
    const spentFlags = inputCommitments.map(async (commitment) => {
      if (commitment.serialNumber) {
        const isSpent = await etherContract.isSpentSerialNumber(commitment.serialNumber);
        await commitment.atomicUpdate((data) => {
          const status = data.rollupTransactionHash ? CommitmentStatus.INCLUDED : CommitmentStatus.QUEUED;
          data.status = isSpent ? CommitmentStatus.SPENT : status;
          data.updatedAt = MystikoHandler.now();
          return data;
        });
        return Promise.resolve(isSpent);
      }
      return Promise.resolve(false);
    });
    const outputFlags = outputCommitments.map(async (commitment) => {
      const isHistoricCommitment = await etherContract.isHistoricCommitment(commitment.commitmentHash);
      await commitment.atomicUpdate((data) => {
        const status = data.rollupTransactionHash ? CommitmentStatus.INCLUDED : CommitmentStatus.QUEUED;
        data.status = isHistoricCommitment ? status : CommitmentStatus.FAILED;
        data.updatedAt = MystikoHandler.now();
        return data;
      });
    });
    const succeeded = (await Promise.all(spentFlags)).filter((flag) => flag).length > 0;
    await Promise.all(outputFlags);
    return transaction.atomicUpdate((data) => {
      data.status = succeeded ? TransactionStatus.SUCCEEDED : TransactionStatus.FAILED;
      data.updatedAt = MystikoHandler.now();
      return data;
    });
  }

  public static calcGasRelayerFee(amount: BN, gasRelayerInfo: GasRelayerInfo): BN {
    const serviceFee = amount.muln(gasRelayerInfo.serviceFeeOfTenThousandth).divn(10000);
    const minGasFee = toBN(gasRelayerInfo.minGasFee);
    return serviceFee.add(minGasFee);
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
    return TransactionExecutorV2.validateNumbers(options).then(() => {
      const walletPromise: Promise<Wallet> = checkPassword
        ? this.context.wallets.checkPassword(options.walletPassword)
        : this.context.wallets.checkCurrent();
      return walletPromise
        .then((wallet) =>
          this.getCommitments(options, contractConfig).then((commitments) => ({ wallet, commitments })),
        )
        .then(({ wallet, commitments }) =>
          this.context.providers
            .checkProvider(options.chainId)
            .then((provider) => ({ wallet, commitments, provider })),
        )
        .then(({ wallet, commitments, provider }) => {
          const chainConfig = this.config.getChainConfig(options.chainId);
          if (!chainConfig) {
            return createErrorPromise(
              `no chain id=${options.chainId} configured`,
              MystikoErrorCode.NON_EXISTING_CHAIN,
            );
          }
          const quote = CommitmentUtils.quote(options, contractConfig, commitments, MAX_NUM_INPUTS);
          let amount = toBN(0);
          if (quote.valid && options.type === TransactionEnum.TRANSFER) {
            amount = toDecimals(options.amount || quote.maxAmount, contractConfig.assetDecimals);
          }
          let publicAmount = toBN(0);
          if (quote.valid && options.type === TransactionEnum.WITHDRAW) {
            publicAmount = toDecimals(options.publicAmount || quote.maxAmount, contractConfig.assetDecimals);
          }
          let rollupFee = toBN(0);
          if (options.rollupFee && quote.valid) {
            rollupFee = toDecimals(options.rollupFee, contractConfig.assetDecimals).mul(
              toBN(quote.numOfSplits),
            );
          }
          let gasRelayerFee = toBN(0);
          const { gasRelayerInfo } = options;
          const rawAmount = options.publicAmount || options.amount;
          if (gasRelayerInfo && rawAmount && quote.valid) {
            gasRelayerFee = TransactionExecutorV2.calcGasRelayerFee(
              toDecimals(rawAmount, contractConfig.assetDecimals),
              gasRelayerInfo,
            );
          }
          if (gasRelayerFee.ltn(0)) {
            return createErrorPromise(
              'gas relayer fee cannot be negative',
              MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
            );
          }
          let selectedCommitments: Commitment[] = [];
          if (quote.valid) {
            const spendingAmount = options.type === TransactionEnum.TRANSFER ? amount : publicAmount;
            selectedCommitments = CommitmentUtils.select(commitments, MAX_NUM_INPUTS, spendingAmount);
          }
          const etherContract = this.context.contractConnector.connect<CommitmentPool>(
            'CommitmentPool',
            contractConfig.address,
            provider,
          );
          const circuitConfig = TransactionExecutorV2.getCircuitConfig(
            quote.numOfInputs,
            quote.numOfSplits,
            contractConfig,
          );
          /* istanbul ignore if */
          if (!circuitConfig) {
            return createErrorPromise(
              `missing circuit config with number of inputs=${quote.numOfInputs} ` +
                `and number of outputs=${quote.numOfSplits}`,
              MystikoErrorCode.NON_EXISTING_CIRCUIT_CONFIG,
            );
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
            etherContract,
            circuitConfig,
          };
        });
    });
  }

  private validateOptions(executionContext: ExecutionContext): Promise<ExecutionContext> {
    const {
      options,
      contractConfig,
      chainConfig,
      quote,
      selectedCommitments,
      amount,
      publicAmount,
      rollupFee,
      gasRelayerFee,
    } = executionContext;
    return this.fetchRemoteContractConfig(options, contractConfig).then(({ minRollupFee }) => {
      if (
        !chainConfig.getPoolContractByAddress(contractConfig.address) ||
        options.assetSymbol !== contractConfig.assetSymbol ||
        options.bridgeType !== chainConfig.getPoolContractBridgeType(contractConfig.address)
      ) {
        return createErrorPromise(
          'given options mismatch with config',
          MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
        );
      }
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
      if (rollupFee.lt(minRollupFee.mul(toBN(quote.numOfSplits)))) {
        return createErrorPromise(
          'rollup fee is too small to pay rollup service',
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
      const { gasRelayerInfo } = options;
      if (gasRelayerInfo) {
        if (gasRelayerInfo.address && !isEthereumAddress(gasRelayerInfo.address)) {
          return createErrorPromise(
            'invalid ethereum address for gas relayer',
            MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
          );
        }
        if (
          gasRelayerInfo.url &&
          !isURL(gasRelayerInfo.url, { protocols: ['http', 'https'], require_tld: false })
        ) {
          return createErrorPromise(
            'invalid endpoint url for gas relayer',
            MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
          );
        }
      }
      /* istanbul ignore if */
      if (selectedCommitments.length === 0) {
        return createErrorPromise(
          'cannot find any private asset to withdraw or transfer',
          MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
        );
      }
      return executionContext;
    });
  }

  private validatePoolBalance(executionContext: ExecutionContext): Promise<ExecutionContext> {
    const { options, contractConfig, publicAmount } = executionContext;
    if (publicAmount.gtn(0)) {
      return this.context.executors
        .getAssetExecutor()
        .balance({
          chainId: options.chainId,
          assetAddress: contractConfig.assetAddress,
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
    const inputSum = CommitmentUtils.sum(selectedCommitments);
    const commitmentPromises: Promise<{ commitment: Commitment; info: CommitmentOutput }>[] = [];
    let remainingAmount;
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

  private createOutputCommitment(
    executionContext: ExecutionContext,
    shieldedAddress: string,
    amount: BN,
  ): Promise<{ commitment: Commitment; info: CommitmentOutput }> {
    const { options, contractConfig } = executionContext;
    return (this.protocol as MystikoProtocolV2)
      .commitment({ publicKeys: shieldedAddress, amount })
      .then((commitmentInfo) => {
        const { commitmentHash, encryptedNote } = commitmentInfo;
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
          status: CommitmentStatus.INIT,
          commitmentHash: commitmentHash.toString(),
          rollupFeeAmount: toDecimals(options.rollupFee || 0, contractConfig.assetDecimals).toString(),
          encryptedNote: toHex(encryptedNote),
          amount: amount.toString(),
          shieldedAddress,
        };
        return this.db.commitments
          .insert(rawCommitment)
          .then((commitment) => ({ commitment, info: commitmentInfo }));
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
        outputCommitments: outputCommitments ? outputCommitments.map((c) => c.commitment.id) : [],
        amount: receivingAmount.toString(),
        publicAmount: receivingPublicAmount.toString(),
        rollupFeeAmount: rollupFee.toString(),
        gasRelayerFeeAmount: gasRelayerFee.toString(),
        gasRelayerAddress: options.gasRelayerInfo?.address,
        shieldedAddress: options.shieldedAddress,
        publicAddress: options.publicAddress,
        status: TransactionStatus.INIT,
        type: options.type,
        wallet: wallet.id,
      })
      .then((transaction) => ({ ...executionContext, transaction }));
  }

  private executeTransaction(executionContext: ExecutionContextWithTransaction): Promise<Transaction> {
    const { options, selectedCommitments, transaction, outputCommitments } = executionContext;
    const outCommitments = outputCommitments ? outputCommitments.map((c) => c.commitment) : [];
    return this.validateSerialNumbers(executionContext)
      .then(() =>
        this.generateProof(executionContext)
          .then((ec) => this.sendTransaction(ec))
          .then((ec) => {
            const promises: Promise<void>[] = [];
            const selectedCommitmentsUpdate: CommitmentUpdate[] = [];
            const outCommitmentsUpdate: CommitmentUpdate[] = [];
            for (let i = 0; i < selectedCommitments.length; i += 1) {
              const commitment = selectedCommitments[i];
              selectedCommitmentsUpdate.push({
                commitment,
                spentTransactionHash: ec.transaction.transactionHash,
                status: CommitmentStatus.SPENT,
              });
            }
            for (let i = 0; i < outCommitments.length; i += 1) {
              const commitment = outCommitments[i];
              outCommitmentsUpdate.push({
                commitment,
                creationTransactionHash: ec.transaction.transactionHash,
                status: CommitmentStatus.QUEUED,
              });
            }
            promises.push(TransactionExecutorV2.updateCommitments(selectedCommitmentsUpdate));
            promises.push(TransactionExecutorV2.updateCommitments(outCommitmentsUpdate));
            return Promise.all(promises).then(() => transaction);
          }),
      )
      .catch((error) => {
        const errorMsg = errorMessage(error);
        this.logger.error(`transaction id=${transaction.id} failed: ${errorMsg}`);
        const promises: Promise<any>[] = [];
        promises.push(
          this.updateTransactionStatus(options, transaction, TransactionStatus.FAILED, {
            errorMessage: errorMsg,
          }).then(() => {}),
        );
        promises.push(
          TransactionExecutorV2.updateCommitments(
            outCommitments.map((commitment) => ({ commitment, status: CommitmentStatus.FAILED })),
          ),
        );
        return Promise.all(promises).then(() => transaction);
      });
  }

  private async generateProof(
    executionContext: ExecutionContextWithTransaction,
  ): Promise<ExecutionContextWithProof> {
    const { options, transaction, selectedCommitments, outputCommitments, gasRelayerFee } = executionContext;
    const merkleTree = await this.fetchMerkleTree(executionContext);
    const staticAssets = await this.fetchStaticAssets(executionContext);
    const accounts = await this.getInputAccounts(executionContext);
    const numInputs = selectedCommitments.length;
    const numOutputs = outputCommitments?.length || 0;
    const randomEtherWallet = ethers.Wallet.createRandom();
    const sigPk = toBuff(randomEtherWallet.address);
    const inVerifyPks: Buffer[] = [];
    const inVerifySks: Buffer[] = [];
    const inEncPks: Buffer[] = [];
    const inEncSks: Buffer[] = [];
    const inCommitments: BN[] = [];
    const inPrivateNotes: Buffer[] = [];
    const pathIndices: number[][] = [];
    const pathElements: BN[][] = [];
    const outVerifyPks: Buffer[] = [];
    const outCommitments: BN[] = [];
    const outRandomPs: BN[] = [];
    const outRandomRs: BN[] = [];
    const outRandomSs: BN[] = [];
    const outAmounts: BN[] = [];
    const outputEncryptedNotes: Buffer[] = [];
    const rollupFeeAmounts: BN[] = [];
    for (let i = 0; i < selectedCommitments.length; i += 1) {
      const commitment = selectedCommitments[i];
      const account = accounts[i];
      const { commitmentHash, leafIndex, encryptedNote } = commitment;
      /* istanbul ignore if */
      if (!encryptedNote || !leafIndex) {
        return createErrorPromise(
          `missing required data of input commitment=${commitmentHash}`,
          MystikoErrorCode.CORRUPTED_COMMITMENT_DATA,
        );
      }
      inVerifyPks.push(account.publicKeyForVerification(this.protocol));
      inVerifySks.push(
        this.protocol.secretKeyForVerification(
          account.secretKeyForVerification(this.protocol, options.walletPassword),
        ),
      );
      inEncPks.push(account.publicKeyForEncryption(this.protocol));
      inEncSks.push(account.secretKeyForEncryption(this.protocol, options.walletPassword));
      inCommitments.push(toBN(commitmentHash));
      inPrivateNotes.push(toBuff(encryptedNote));
      const merklePath = merkleTree.path(toBN(leafIndex).toNumber());
      pathIndices.push(merklePath.pathIndices);
      pathElements.push(merklePath.pathElements);
    }
    if (outputCommitments) {
      for (let i = 0; i < outputCommitments.length; i += 1) {
        const { commitment, info } = outputCommitments[i];
        const { shieldedAddress, amount, rollupFeeAmount } = commitment;
        const { randomP, randomR, randomS, commitmentHash, encryptedNote } = info;
        /* istanbul ignore if */
        if (!shieldedAddress || !amount) {
          return createErrorPromise(
            `missing required data of output commitment=${commitmentHash.toString()}`,
            MystikoErrorCode.CORRUPTED_COMMITMENT_DATA,
          );
        }
        const { pkVerify } = this.protocol.publicKeysFromShieldedAddress(shieldedAddress);
        outVerifyPks.push(pkVerify);
        outCommitments.push(commitmentHash);
        outRandomPs.push(randomP);
        outRandomRs.push(randomR);
        outRandomSs.push(randomS);
        outAmounts.push(toBN(amount));
        rollupFeeAmounts.push(toBN(rollupFeeAmount || 0));
        outputEncryptedNotes.push(encryptedNote);
      }
    }
    const randomAuditingSecretKey = ECIES.generateSecretKey();
    const auditorPublicKeys = await this.getAuditorPublicKeys(executionContext);
    this.logger.info(`generating proof for transaction id=${transaction.id}`);
    const newTransaction = await this.updateTransactionStatus(
      options,
      transaction,
      TransactionStatus.PROOF_GENERATING,
    );
    const proof = await (this.protocol as MystikoProtocolV2).zkProveTransaction({
      numInputs,
      numOutputs,
      inVerifyPks,
      inVerifySks,
      inEncPks,
      inEncSks,
      inCommitments,
      inPrivateNotes,
      pathIndices,
      pathElements,
      sigPk,
      treeRoot: merkleTree.root(),
      publicAmount: toBN(transaction.publicAmount),
      relayerFeeAmount: gasRelayerFee,
      rollupFeeAmounts,
      outVerifyPks,
      outAmounts,
      outCommitments,
      outRandomPs,
      outRandomRs,
      outRandomSs,
      program: staticAssets.zkProgram,
      provingKey: staticAssets.zkProvingKey,
      abi: staticAssets.zkAbi,
      randomAuditingSecretKey,
      auditorPublicKeys,
    });
    const proofValid = await (this.protocol as MystikoProtocolV2).zkVerify(
      proof,
      staticAssets.zkVerifyingKey,
    );
    /* istanbul ignore if */
    if (!proofValid) {
      return createErrorPromise('generated an invalid proof', MystikoErrorCode.INVALID_ZKP_PROOF);
    }
    this.logger.info(`proof is generated successfully for transaction id=${transaction.id}`);
    const updatedTransaction = await this.updateTransactionStatus(
      options,
      newTransaction,
      TransactionStatus.PROOF_GENERATED,
    );
    return {
      ...executionContext,
      numInputs,
      numOutputs,
      outputEncryptedNotes,
      proof,
      transaction: updatedTransaction,
      randomEtherWallet,
      numOfAuditors: this.protocol.numOfAuditors,
      randomAuditingSecretKey,
    };
  }

  private getAuditorPublicKeys(executionContext: ExecutionContext): Promise<BN[]> {
    const { etherContract } = executionContext;
    return etherContract.getAllAuditorPublicKeys().then((rawPublicKeys) => {
      if (rawPublicKeys.length !== this.protocol.numOfAuditors) {
        return createErrorPromise(
          'number of auditors saved in contract is incorrect: actual ' +
            `${rawPublicKeys.length} vs expected ${this.protocol.numOfAuditors}`,
          MystikoErrorCode.WRONG_AUDITOR_NUMBER,
        );
      }
      return rawPublicKeys.map((pk) => toBN(pk.toString()));
    });
  }

  private async fetchMerkleTree(executionContext: ExecutionContextWithTransaction): Promise<MerkleTree> {
    const { options, contractConfig, transaction, selectedCommitments } = executionContext;
    await this.updateTransactionStatus(options, transaction, TransactionStatus.MERKLE_TREE_FETCHING);
    let expectedLeafIndex: number | undefined;
    selectedCommitments.forEach((commitment) => {
      if (commitment.leafIndex) {
        const leafIndex = toBN(commitment.leafIndex).toNumber();
        if (!expectedLeafIndex || leafIndex > expectedLeafIndex) {
          expectedLeafIndex = leafIndex;
        }
      }
    });
    const { progressListener } = options;
    const merkleTree = await this.context.executors.getMerkleTreeExecutor().get({
      chainId: transaction.chainId,
      contractAddress: contractConfig.address,
      expectedLeafIndex,
      raw: options.rawMerkleTree,
      providerTimeoutMs: options.providerTimeoutMs,
      downloadEventListener: TransactionExecutorV2.wrapDownloadEventListener(
        TransactionStatus.MERKLE_TREE_FETCHING,
        1,
        1,
        progressListener,
      ),
    });
    await this.updateTransactionStatus(options, transaction, TransactionStatus.MERKLE_TREE_FETCHED);
    if (merkleTree) {
      return merkleTree;
    }
    return createErrorPromise(
      `no merkle tree found for chainId=${transaction.chainId} and contractAddress=${contractConfig.address}`,
      MystikoErrorCode.NO_MERKLE_TREE_FOUND,
    );
  }

  private async fetchStaticAssets(executionContext: ExecutionContextWithTransaction): Promise<StaticAssets> {
    const { circuitConfig, options, transaction } = executionContext;
    this.logger.info(`fetching zkp circuits assets for transaction type=${circuitConfig.type}`);
    await this.updateTransactionStatus(options, transaction, TransactionStatus.STATIC_ASSETS_FETCHING);
    const { progressListener } = options;
    const zkProgram =
      options.rawZkProgram ||
      (await readCompressedFile(
        circuitConfig.programFile,
        undefined,
        undefined,
        TransactionExecutorV2.wrapDownloadEventListener(
          TransactionStatus.STATIC_ASSETS_FETCHING,
          4,
          1,
          progressListener,
        ),
      ));
    const zkProvingKey =
      options.rawZkProvingKey ||
      (await readCompressedFile(
        circuitConfig.provingKeyFile,
        undefined,
        undefined,
        TransactionExecutorV2.wrapDownloadEventListener(
          TransactionStatus.STATIC_ASSETS_FETCHING,
          4,
          2,
          progressListener,
        ),
      ));
    const zkVerifyingKey =
      options.rawZkVerifyingKey ||
      (await readCompressedFile(
        circuitConfig.verifyingKeyFile,
        undefined,
        undefined,
        TransactionExecutorV2.wrapDownloadEventListener(
          TransactionStatus.STATIC_ASSETS_FETCHING,
          4,
          3,
          progressListener,
        ),
      ));
    const zkAbi =
      options.rawZkAbi ||
      (await readFile(
        circuitConfig.abiFile,
        undefined,
        undefined,
        undefined,
        TransactionExecutorV2.wrapDownloadEventListener(
          TransactionStatus.STATIC_ASSETS_FETCHING,
          4,
          4,
          progressListener,
        ),
      ));
    const assets = {
      zkProgram,
      zkProvingKey,
      zkVerifyingKey: zkVerifyingKey.toString(),
      zkAbi: zkAbi.toString(),
    };
    await this.updateTransactionStatus(options, transaction, TransactionStatus.STATIC_ASSETS_FETCHED);
    this.logger.info(`fetched zkp circuits assets successfully for transaction type=${circuitConfig.type}`);
    return assets;
  }

  private sendTransaction(executionContext: ExecutionContextWithProof): Promise<ExecutionContextWithRequest> {
    const { contractConfig, chainConfig, transaction, selectedCommitments } = executionContext;
    const request = TransactionExecutorV2.buildTransactionRequest(executionContext);
    for (let i = 0; i < request.serialNumbers.length; i += 1) {
      const commitment = selectedCommitments[i];
      if (commitment.serialNumber !== ethers.BigNumber.from(request.serialNumbers[i]).toString()) {
        return createErrorPromise(
          `generated commitment id=${commitment.id} serial number mismatch`,
          MystikoErrorCode.CORRUPTED_COMMITMENT_DATA,
        );
      }
    }
    return TransactionExecutorV2.signRequest(executionContext, request)
      .then((signature) => {
        this.logger.info(
          `submitting transaction id=${transaction.id} to ` +
            `chain id=${chainConfig.chainId} and contract address=${contractConfig.address}`,
        );
        const { gasRelayerInfo } = executionContext.options;
        if (gasRelayerInfo) {
          return this.sendTransactionViaGasRelayer(executionContext, request, signature, gasRelayerInfo);
        }
        return this.sendTransactionViaWallet(executionContext, request, signature);
      })
      .then((tx) => ({ ...executionContext, transaction: tx, request }));
  }

  private sendTransactionViaGasRelayer(
    executionContext: ExecutionContextWithProof,
    request: ICommitmentPool.TransactRequestStruct,
    signature: string,
    gasRelayerInfo: GasRelayerInfo,
  ): Promise<Transaction> {
    const { options, circuitConfig, contractConfig, chainConfig, transaction } = executionContext;
    this.logger.info(
      `submitting transaction id=${transaction.id} to ` +
        `chain id=${chainConfig.chainId} and contract address=${contractConfig.address}` +
        ` via gas relayer(url=${gasRelayerInfo.url}, name=${gasRelayerInfo.name}, address=${gasRelayerInfo.address})`,
    );
    return this.context.gasRelayers
      .relayTransact({
        relayerUrl: gasRelayerInfo.url,
        transactRequest: {
          type: options.type === TransactionEnum.TRANSFER ? JobTypeEnum.TRANSFER : JobTypeEnum.WITHDRAW,
          bridgeType: options.bridgeType,
          chainId: options.chainId,
          symbol: options.assetSymbol,
          mystikoContractAddress: contractConfig.address,
          circuitType: circuitConfig.type,
          signature,
          ...request,
        },
      })
      .then((resp) => {
        this.logger.info(
          `successfully submitted transaction id=${transaction.id} to ` +
            `chain id=${chainConfig.chainId} and contract address=${contractConfig.address}, ` +
            `transaction hash=${resp.hash}` +
            ` via gas relayer(url=${gasRelayerInfo.url}, name=${gasRelayerInfo.name}, address=${gasRelayerInfo.address})`,
        );
        return this.updateTransactionStatus(options, transaction, TransactionStatus.PENDING, {
          transactionHash: resp.hash,
        }).then((tx) => ({ tx, resp }));
      })
      .then(({ tx, resp }) =>
        this.context.providers.checkProvider(options.chainId).then((provider) => ({ tx, resp, provider })),
      )
      .then(({ tx, resp, provider }) =>
        waitTransactionHash(
          provider,
          resp.hash,
          options.numOfConfirmations || chainConfig.safeConfirmations,
          options.gasRelayerWaitingTimeoutMs || DEFAULT_GAS_RELAYER_WAITING_TIMEOUT_MS,
        ).then((receipt) => {
          this.logger.info(
            `transaction id=${transaction.id} to ` +
              `chain id=${chainConfig.chainId} and contract address=${contractConfig.address} is confirmed on ` +
              `gas relayer(url=${gasRelayerInfo.url}, name=${gasRelayerInfo.name}, address=${gasRelayerInfo.address})`,
          );
          return this.updateTransactionStatus(options, tx, TransactionStatus.SUCCEEDED, {
            transactionHash: receipt.transactionHash,
          });
        }),
      );
  }

  private async sendTransactionViaWallet(
    executionContext: ExecutionContextWithProof,
    request: ICommitmentPool.TransactRequestStruct,
    signature: string,
  ): Promise<Transaction> {
    const { options, contractConfig, chainConfig, transaction, etherContract, outputCommitments } =
      executionContext;
    const outCommitments = outputCommitments ? outputCommitments.map((c) => c.commitment) : [];
    this.logger.info(
      `submitting transaction id=${transaction.id} to ` +
        `chain id=${chainConfig.chainId} and contract address=${contractConfig.address} via connected wallet`,
    );
    const etherContractWithSigner = etherContract.connect(options.signer.signer);
    const txPromise = options.transactOverrides
      ? etherContractWithSigner.transact(request, signature, options.transactOverrides)
      : etherContractWithSigner.transact(request, signature);
    const resp = await txPromise;
    this.logger.info(
      `successfully submitted transaction id=${transaction.id} to ` +
        `chain id=${chainConfig.chainId} and contract address=${contractConfig.address}, ` +
        `transaction hash=${resp.hash} via connected wallet`,
    );
    const tx = await this.updateTransactionStatus(options, transaction, TransactionStatus.PENDING, {
      transactionHash: resp.hash,
    });
    const outCommitmentsUpdate = outCommitments.map((commitment) => ({
      commitment,
      creationTransactionHash: tx.transactionHash,
      status: CommitmentStatus.SRC_PENDING,
    }));
    if (outCommitmentsUpdate.length > 0) {
      await TransactionExecutorV2.updateCommitments(outCommitmentsUpdate);
    }
    const receipt = await waitTransaction(
      resp,
      options.numOfConfirmations || chainConfig.safeConfirmations,
      options.waitTimeoutMs || DEFAULT_WAIT_TIMEOUT_MS,
    );
    this.logger.info(
      `transaction id=${transaction.id} to ` +
        `chain id=${chainConfig.chainId} and contract address=${contractConfig.address}` +
        ` is confirmed on chain, gas used=${receipt.gasUsed.toString()}`,
    );
    return this.updateTransactionStatus(options, tx, TransactionStatus.SUCCEEDED, {
      transactionHash: receipt.transactionHash,
    });
  }

  private updateTransactionStatus(
    options: TransactionOptions,
    transaction: Transaction,
    newStatus: TransactionStatus,
    extraData?: TransactionUpdate,
  ): Promise<Transaction> {
    const oldStatus = transaction.status as TransactionStatus;
    if (oldStatus !== newStatus || extraData) {
      const wrappedData: TransactionUpdate = extraData || {};
      wrappedData.status = newStatus;
      return this.context.transactions.update(transaction.id, wrappedData).then((newTransaction) => {
        if (options.statusCallback && oldStatus !== newStatus) {
          try {
            options.statusCallback(newTransaction, oldStatus, newStatus);
          } catch (error) {
            this.logger.warn(`status callback execution failed: ${errorMessage(error)}`);
          }
        }
        return newTransaction;
      });
    }
    /* istanbul ignore next */
    return Promise.resolve(transaction);
  }

  private validateSerialNumbers(executionContext: ExecutionContext): Promise<ExecutionContext> {
    const { etherContract, options } = executionContext;
    const { selectedCommitments } = executionContext;
    const serialNumberPromises: Promise<boolean>[] = [];
    for (let i = 0; i < selectedCommitments.length; i += 1) {
      const commitment = selectedCommitments[i];
      const { serialNumber } = selectedCommitments[i];
      let serialNumberPromise: Promise<Commitment[]>;
      if (!serialNumber) {
        serialNumberPromise = this.context.executors.getCommitmentExecutor().decrypt({
          walletPassword: options.walletPassword,
          commitments: [commitment],
        });
      } else {
        serialNumberPromise = Promise.resolve([commitment]);
      }
      serialNumberPromises.push(
        serialNumberPromise.then(([updatedCommitment]) => {
          const updatedSerialNumber = updatedCommitment.serialNumber;
          if (!updatedSerialNumber) {
            return createErrorPromise(
              `serial number of commitment id=${updatedCommitment.id} is empty`,
              MystikoErrorCode.CORRUPTED_COMMITMENT_DATA,
            );
          }
          return etherContract.isSpentSerialNumber(updatedSerialNumber).then((spent) => {
            if (spent) {
              return TransactionExecutorV2.updateCommitments([
                { commitment: updatedCommitment, status: CommitmentStatus.SPENT },
              ]).then(() => spent);
            }
            return spent;
          });
        }),
      );
    }
    return Promise.all(serialNumberPromises).then((spentFlags) => {
      const doubleSpent = spentFlags.filter((spent) => spent).length > 0;
      if (doubleSpent) {
        return createErrorPromise(
          'some commitments hava already been spent',
          MystikoErrorCode.INVALID_TRANSACTION_REQUEST,
        );
      }
      return Promise.resolve(executionContext);
    });
  }

  private static updateCommitments(commitments: CommitmentUpdate[]): Promise<void> {
    const updatePromises: Promise<Commitment>[] = [];
    for (let i = 0; i < commitments.length; i += 1) {
      const commitmentUpdate = commitments[i];
      updatePromises.push(
        commitmentUpdate.commitment.atomicUpdate((data) => {
          let hasUpdate = false;
          if (commitmentUpdate.status) {
            data.status = commitmentUpdate.status;
            hasUpdate = true;
          }
          if (commitmentUpdate.creationTransactionHash) {
            data.creationTransactionHash = commitmentUpdate.creationTransactionHash;
            hasUpdate = true;
          }
          if (commitmentUpdate.spentTransactionHash) {
            data.spendingTransactionHash = commitmentUpdate.spentTransactionHash;
            hasUpdate = true;
          }
          if (hasUpdate) {
            data.updatedAt = MystikoHandler.now();
          }
          return data;
        }),
      );
    }
    return Promise.all(updatePromises).then(() => {});
  }

  private static buildTransactionRequest(
    executionContext: ExecutionContextWithProof,
  ): ICommitmentPool.TransactRequestStruct {
    const {
      options,
      proof,
      numInputs,
      numOutputs,
      outputEncryptedNotes,
      numOfAuditors,
      randomAuditingSecretKey,
    } = executionContext;
    const randomAuditingPublicKey = ECIES.publicKey(randomAuditingSecretKey);
    const encryptedAuditorNotes = proof.inputs
      .slice(proof.inputs.length - numInputs * numOfAuditors)
      .map((n) => ethers.BigNumber.from(n).toString());
    const proofABC = proof.proof as { a: any; b: any; c: any };
    return {
      proof: {
        a: { X: proofABC.a[0], Y: proofABC.a[1] },
        b: { X: proofABC.b[0], Y: proofABC.b[1] },
        c: { X: proofABC.c[0], Y: proofABC.c[1] },
      },
      rootHash: proof.inputs[0],
      serialNumbers: proof.inputs.slice(1, 1 + numInputs),
      sigHashes: proof.inputs.slice(1 + numInputs, 1 + 2 * numInputs),
      sigPk: proof.inputs[1 + 2 * numInputs],
      publicAmount: proof.inputs[2 + 2 * numInputs],
      relayerFeeAmount: proof.inputs[3 + 2 * numInputs],
      outCommitments: proof.inputs.slice(4 + 2 * numInputs, 4 + 2 * numInputs + numOutputs),
      outRollupFees: proof.inputs.slice(4 + 2 * numInputs + numOutputs, 4 + 2 * numInputs + 2 * numOutputs),
      publicRecipient: options.publicAddress || MAIN_ASSET_ADDRESS,
      relayerAddress: options.gasRelayerInfo?.address || MAIN_ASSET_ADDRESS,
      outEncryptedNotes: outputEncryptedNotes.map(toHex),
      randomAuditingPublicKey: randomAuditingPublicKey.toString(),
      encryptedAuditorNotes,
    };
  }

  private static signRequest(
    executionContext: ExecutionContextWithProof,
    request: ICommitmentPool.TransactRequestStruct,
  ): Promise<string> {
    const { publicRecipient, relayerAddress } = request;
    const { randomEtherWallet, outputEncryptedNotes, transaction, proof } = executionContext;
    const bytes = Buffer.concat([toBuff(publicRecipient), toBuff(relayerAddress), ...outputEncryptedNotes]);
    return randomEtherWallet.signMessage(toBuff(ethers.utils.keccak256(bytes))).then((signature) =>
      transaction
        .atomicUpdate((data) => {
          data.proof = JSON.stringify(proof);
          data.rootHash = ethers.BigNumber.from(request.rootHash).toString();
          data.signature = signature;
          data.signaturePublicKey = ethers.utils.hexlify(request.sigPk);
          data.signaturePublicKeyHashes = request.sigHashes.map((h) => ethers.BigNumber.from(h).toString());
          data.serialNumbers = request.serialNumbers.map((sn) => ethers.BigNumber.from(sn).toString());
          data.randomAuditingPublicKey = request.randomAuditingPublicKey.toString();
          data.encryptedAuditorNotes = request.encryptedAuditorNotes.map((n) => n.toString());
          data.updatedAt = MystikoHandler.now();
          return data;
        })
        .then(() => signature),
    );
  }

  private getInputAccounts(executionContext: ExecutionContext): Promise<Account[]> {
    const { selectedCommitments } = executionContext;
    const accountPromises: Promise<Account>[] = [];
    for (let i = 0; i < selectedCommitments.length; i += 1) {
      const commitment = selectedCommitments[i];
      const { commitmentHash, shieldedAddress } = commitment;
      /* istanbul ignore if */
      if (!shieldedAddress) {
        return createErrorPromise(
          `missing required data of input commitment=${commitmentHash}`,
          MystikoErrorCode.CORRUPTED_COMMITMENT_DATA,
        );
      }
      accountPromises.push(
        this.context.accounts.findOne(shieldedAddress).then((account) => {
          /* istanbul ignore if */
          if (account === null) {
            return createErrorPromise(
              `account with mystiko address=${shieldedAddress} does not exist in your wallet`,
              MystikoErrorCode.NON_EXISTING_ACCOUNT,
            );
          }
          return account;
        }),
      );
    }
    return Promise.all(accountPromises);
  }

  private fetchRemoteContractConfig(
    options: TransactionOptions | TransactionQuoteOptions,
    config: PoolContractConfig,
  ): Promise<RemoteContractConfig> {
    return this.context.providers
      .checkProvider(options.chainId)
      .then((provider) => {
        const poolContract = this.context.contractConnector.connect<CommitmentPool>(
          'CommitmentPool',
          config.address,
          provider,
        );
        return { poolContract };
      })
      .then(({ poolContract }) => poolContract.getMinRollupFee())
      .then((minRollupFee) => ({ minRollupFee: toBN(minRollupFee.toString()) }))
      .catch((error) => {
        this.logger.warn(
          `failed to fetch remote config for contract chainId=${options.chainId}, address=${
            config.address
          }: ${errorMessage(error)}`,
        );
        return { minRollupFee: config.minRollupFee };
      });
  }

  private static getCircuitConfig(
    numInputs: number,
    numOutputs: number,
    contractConfig: PoolContractConfig,
  ): CircuitConfig | undefined {
    let config: CircuitConfig | undefined;
    if (numInputs === 1 && numOutputs === 0) {
      config = contractConfig.getCircuitConfig(CircuitType.TRANSACTION1x0);
    } else if (numInputs === 1 && numOutputs === 1) {
      config = contractConfig.getCircuitConfig(CircuitType.TRANSACTION1x1);
    } else if (numInputs === 1 && numOutputs === 2) {
      config = contractConfig.getCircuitConfig(CircuitType.TRANSACTION1x2);
    } else if (numInputs === 2 && numOutputs === 0) {
      config = contractConfig.getCircuitConfig(CircuitType.TRANSACTION2x0);
    } else if (numInputs === 2 && numOutputs === 1) {
      config = contractConfig.getCircuitConfig(CircuitType.TRANSACTION2x1);
    } else if (numInputs === 2 && numOutputs === 2) {
      config = contractConfig.getCircuitConfig(CircuitType.TRANSACTION2x2);
    }
    return config;
  }

  private static validateNumbers(options: TransactionOptions): Promise<TransactionOptions> {
    if (options.type === TransactionEnum.TRANSFER) {
      if (!options.amount || options.amount <= 0) {
        return createErrorPromise(
          'amount cannot be negative or zero or empty',
          MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
        );
      }
    } else if (!options.publicAmount || options.publicAmount <= 0) {
      return createErrorPromise(
        'publicAmount cannot be negative or zero or empty',
        MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
      );
    }
    if (options.rollupFee && options.rollupFee < 0) {
      return createErrorPromise(
        'rollup fee cannot be negative',
        MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
      );
    }
    return Promise.resolve(options);
  }

  private getRegisteredRelayers(
    options: TransactionQuoteOptions,
    config: PoolContractConfig,
    quote: TransactionQuote,
  ): Promise<TransactionQuoteWithRelayers> {
    const rawAmount = options.publicAmount || options.amount;
    if (!rawAmount) {
      return Promise.resolve({ ...quote, gasRelayers: [] });
    }
    const circuitConfig = TransactionExecutorV2.getCircuitConfig(
      quote.numOfInputs,
      quote.numOfSplits,
      config,
    );
    /* istanbul ignore if */
    if (!circuitConfig) {
      return createErrorPromise(
        `missing circuit config with number of inputs=${quote.numOfInputs} ` +
          `and number of outputs=${quote.numOfSplits}`,
        MystikoErrorCode.NON_EXISTING_CIRCUIT_CONFIG,
      );
    }
    return this.context.gasRelayers
      .registerInfo({
        chainId: options.chainId,
        options: {
          assetSymbol: options.assetSymbol,
          assetDecimals: config.assetDecimals,
          circuitType: circuitConfig.type,
        },
      })
      .then((gasRelayers) => this.filterGasRelayerInfo(rawAmount, gasRelayers, config))
      .then((gasRelayers) => ({ ...quote, gasRelayers }))
      .catch((error) => {
        this.logger.error(`failed to get gas relayers from remote: ${errorMessage(error)}`);
        return { ...quote, gasRelayers: [] };
      });
  }

  private filterGasRelayerInfo(
    rawAmount: number,
    rawInfos: RawGasRelayerInfo[],
    config: PoolContractConfig,
  ): GasRelayerInfo[] {
    const filtered: GasRelayerInfo[] = [];
    rawInfos.forEach((rawInfo) => {
      if (rawInfo.available && rawInfo.support) {
        const { contracts } = rawInfo;
        if (contracts) {
          for (let i = 0; i < contracts.length; i += 1) {
            if (contracts[i].assetSymbol === config.assetSymbol) {
              const gasRelayerInfo: GasRelayerInfo = {
                url: rawInfo.registerUrl,
                name: rawInfo.registerName,
                address: rawInfo.relayerAddress,
                serviceFeeOfTenThousandth: contracts[i].relayerFeeOfTenThousandth,
                serviceFeeRatio: contracts[i].relayerFeeOfTenThousandth / 10000.0,
                minGasFee: contracts[i].minimumGasFee,
                minGasFeeNumber: fromDecimals(contracts[i].minimumGasFee, config.assetDecimals),
              };
              const amount = toDecimals(rawAmount, config.assetDecimals);
              const gasRelayerFee = TransactionExecutorV2.calcGasRelayerFee(amount, gasRelayerInfo);
              if (gasRelayerFee.lt(amount)) {
                filtered.push(gasRelayerInfo);
              }
            }
          }
        }
      }
    });
    return filtered;
  }

  private static parseProgressEvent(progressEvent: any): number {
    if (progressEvent && progressEvent.total && progressEvent.loaded) {
      return Math.round((progressEvent.loaded * 100) / progressEvent.total);
    }
    return 100;
  }

  private static wrapDownloadEventListener(
    transactionStatus: TransactionStatus,
    totalSteps: number,
    currentStep: number,
    listener?: TransactionProgressListener,
  ): ((progressEvent: any) => void) | undefined {
    if (listener) {
      return (progressEvent: any) => {
        const currentProgress = TransactionExecutorV2.parseProgressEvent(progressEvent);
        listener({
          transactionStatus,
          totalSteps,
          currentStep,
          currentProgress,
        });
      };
    }
    return undefined;
  }
}
