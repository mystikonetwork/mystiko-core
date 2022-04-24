import {
  ChainConfig,
  CircuitConfig,
  CircuitType,
  MAIN_ASSET_ADDRESS,
  PoolContractConfig,
} from '@mystikonetwork/config';
import { CommitmentPool, ICommitmentPool, MystikoContractFactory } from '@mystikonetwork/contracts-abi';
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
import { checkSigner } from '@mystikonetwork/ethers';
import { CommitmentV1, MystikoProtocolV2 } from '@mystikonetwork/protocol';
import {
  errorMessage,
  fromDecimals,
  MerkleTree,
  toBN,
  toBuff,
  toDecimals,
  toHex,
  waitTransaction,
} from '@mystikonetwork/utils';
import BN from 'bn.js';
import { isEthereumAddress } from 'class-validator';
import { ethers } from 'ethers';
import { Proof } from 'zokrates-js';
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
  outputCommitments?: Array<{ commitment: Commitment; info: CommitmentV1 }>;
};

type ExecutionContextWithTransaction = ExecutionContext & {
  transaction: Transaction;
};

type ExecutionContextWithProof = ExecutionContextWithTransaction & {
  numInputs: number;
  numOutputs: number;
  outputEncryptedNotes: Buffer[];
  proof: Proof;
  randomEtherWallet: ethers.Wallet;
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
        transactionPromise: this.executeTransaction(executionContext),
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
      const commitmentPromises: Promise<{ commitment: Commitment; info: CommitmentV1 }>[] = [];
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
    return Promise.resolve(executionContext);
  }

  private createOutputCommitment(
    executionContext: ExecutionContext,
    shieldedAddress: string,
    amount: BN,
  ): Promise<{ commitment: Commitment; info: CommitmentV1 }> {
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

  private executeTransaction(executionContext: ExecutionContextWithTransaction): Promise<Transaction> {
    const { options, selectedCommitments, transaction, outputCommitments } = executionContext;
    const outCommitments = outputCommitments ? outputCommitments.map((c) => c.commitment) : [];
    return this.generateProof(executionContext)
      .then((ec) => this.sendTransaction(ec))
      .then(() => {
        const promises: Promise<void>[] = [];
        promises.push(
          TransactionExecutorV2.updateCommitmentsStatus(selectedCommitments, CommitmentStatus.SPENT),
        );
        promises.push(TransactionExecutorV2.updateCommitmentsStatus(outCommitments, CommitmentStatus.QUEUED));
        return Promise.all(promises).then(() => transaction);
      })
      .catch((error) => {
        const errorMsg = errorMessage(error);
        this.logger.error(`transaction id=${transaction.id} failed: ${errorMsg}`);
        const promises: Promise<any>[] = [];
        promises.push(
          this.updateTransactionStatus(options, transaction, TransactionStatus.FAILED, {
            errorMessage: errorMsg,
          }).then(() => {}),
        );
        promises.push(TransactionExecutorV2.updateCommitmentsStatus(outCommitments, CommitmentStatus.FAILED));
        return Promise.all(promises).then(() => transaction);
      });
  }

  private generateProof(
    executionContext: ExecutionContextWithTransaction,
  ): Promise<ExecutionContextWithProof> {
    const { options, transaction } = executionContext;
    this.logger.info(`generating proof for transaction id=${transaction.id}`);
    return this.updateTransactionStatus(options, transaction, TransactionStatus.PROOF_GENERATING).then(
      (newTransaction) =>
        this.buildMerkleTree(executionContext)
          .then((merkleTree) =>
            this.getInputAccounts(executionContext).then((accounts) => ({ merkleTree, accounts })),
          )
          .then(({ merkleTree, accounts }) => {
            const { contractConfig, selectedCommitments, outputCommitments, publicAmount, gasRelayerFee } =
              executionContext;
            const numInputs = selectedCommitments.length;
            const numOutputs = outputCommitments?.length || 0;
            const circuitConfig = TransactionExecutorV2.getCircuitConfig(
              numOutputs,
              numOutputs,
              contractConfig,
            );
            if (!circuitConfig) {
              return createErrorPromise(
                `missing circuit config with number of inputs=${numInputs} ` +
                  `and number of outputs=${numOutputs}`,
                MystikoErrorCode.NON_EXISTING_CIRCUIT_CONFIG,
              );
            }
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
              const account = accounts[0];
              const { commitmentHash, leafIndex, encryptedNote } = commitment;
              if (!encryptedNote || !leafIndex) {
                return createErrorPromise(
                  `missing required data of input commitment=${commitmentHash}`,
                  MystikoErrorCode.CORRUPTED_COMMITMENT_DATA,
                );
              }
              inVerifyPks.push(account.publicKeyForVerification(this.protocol));
              inVerifySks.push(account.secretKeyForVerification(this.protocol, options.walletPassword));
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
                const { randomP, randomR, randomS, commitmentHash, privateNote } = info;
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
                outputEncryptedNotes.push(privateNote);
              }
            }
            return (this.protocol as MystikoProtocolV2)
              .zkProveTransaction({
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
                publicAmount,
                relayerFeeAmount: gasRelayerFee,
                rollupFeeAmounts,
                outVerifyPks,
                outAmounts,
                outCommitments,
                outRandomPs,
                outRandomRs,
                outRandomSs,
                programFile: circuitConfig.programFile,
                provingKeyFile: circuitConfig.provingKeyFile,
                abiFile: circuitConfig.abiFile,
              })
              .then((proof) =>
                (this.protocol as MystikoProtocolV2)
                  .zkVerify(proof, circuitConfig.verifyingKeyFile)
                  .then((proofValid) => {
                    if (!proofValid) {
                      return createErrorPromise(
                        'generated an invalid proof',
                        MystikoErrorCode.INVALID_ZKP_PROOF,
                      );
                    }
                    this.logger.info(`proof is generated successfully for transaction id=${transaction.id}`);
                    return proof;
                  }),
              )
              .then((proof) =>
                this.updateTransactionStatus(options, newTransaction, TransactionStatus.PROOF_GENERATED).then(
                  (tx) => ({
                    ...executionContext,
                    numInputs,
                    numOutputs,
                    outputEncryptedNotes,
                    proof,
                    transaction: tx,
                  }),
                ),
              );
          }),
    );
  }

  private buildMerkleTree(executionContext: ExecutionContext): Promise<MerkleTree> {
    const { options, contractConfig } = executionContext;
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

  private sendTransaction(executionContext: ExecutionContextWithProof): Promise<ExecutionContextWithProof> {
    const { options, contractConfig, transaction } = executionContext;
    const { signer } = options;
    const contract = MystikoContractFactory.connect<CommitmentPool>(
      'CommitmentPool',
      contractConfig.address,
      signer.signer,
    );
    const request = TransactionExecutorV2.buildTransactionRequest(executionContext);
    return TransactionExecutorV2.validateRequest(executionContext, request, contract).then(() =>
      TransactionExecutorV2.signRequest(executionContext, request)
        .then((signature) => contract.transact(request, signature))
        .then((resp) =>
          this.updateTransactionStatus(options, transaction, TransactionStatus.PENDING, {
            transactionHash: resp.hash,
          }).then((tx) => ({ tx, resp })),
        )
        .then(({ tx, resp }) =>
          waitTransaction(resp).then((receipt) =>
            this.updateTransactionStatus(options, tx, TransactionStatus.SUCCEEDED, {
              transactionHash: receipt.transactionHash,
            }),
          ),
        )
        .then((tx) => ({ ...executionContext, transaction: tx })),
    );
  }

  private updateTransactionStatus(
    options: TransactionOptions,
    transaction: Transaction,
    newStatus: TransactionStatus,
    extraData?: TransactionUpdate,
  ): Promise<Transaction> {
    const oldStatus = transaction.status as TransactionStatus;
    if (oldStatus !== newStatus && !extraData) {
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
    return Promise.resolve(transaction);
  }

  private static validateRequest(
    executionContext: ExecutionContextWithProof,
    request: ICommitmentPool.TransactRequestStruct,
    contract: CommitmentPool,
  ): Promise<ExecutionContextWithProof> {
    return contract
      .isKnownRoot(request.rootHash)
      .then((validRoot) => {
        if (!validRoot) {
          return createErrorPromise(
            'unknown merkle tree root, your wallet data might be out of sync or be corrupted',
            MystikoErrorCode.INVALID_TRANSACTION_REQUEST,
          );
        }
        return Promise.resolve();
      })
      .then(() => TransactionExecutorV2.validateSerialNumbers(executionContext, request, contract));
  }

  private static validateSerialNumbers(
    executionContext: ExecutionContextWithProof,
    request: ICommitmentPool.TransactRequestStruct,
    contract: CommitmentPool,
  ): Promise<ExecutionContextWithProof> {
    const { selectedCommitments } = executionContext;
    const { serialNumbers } = request;
    if (serialNumbers.length !== selectedCommitments.length) {
      return createErrorPromise(
        'number of serial numbers is not equal to number of input commitments',
        MystikoErrorCode.INVALID_TRANSACTION_REQUEST,
      );
    }
    const serialNumberPromises: Promise<boolean>[] = [];
    for (let i = 0; i < serialNumbers.length; i += 1) {
      const commitment = selectedCommitments[i];
      const serialNumber = serialNumbers[i];
      serialNumberPromises.push(
        contract.spentSerialNumbers(serialNumber).then((spent) => {
          if (spent) {
            return commitment
              .atomicUpdate((data) => {
                data.status = CommitmentStatus.SPENT;
                return data;
              })
              .then(() => spent);
          }
          return spent;
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

  private static updateCommitmentsStatus(commitments: Commitment[], status: CommitmentStatus): Promise<void> {
    const updatePromises: Promise<Commitment>[] = [];
    for (let i = 0; i < commitments.length; i += 1) {
      const commitment = commitments[i];
      updatePromises.push(
        commitment.atomicUpdate((data) => {
          data.status = status;
          data.updatedAt = MystikoHandler.now();
          return data;
        }),
      );
    }
    return Promise.all(updatePromises).then(() => {});
  }

  private static buildTransactionRequest(
    executionContext: ExecutionContextWithProof,
  ): ICommitmentPool.TransactRequestStruct {
    const { options, proof, numInputs, numOutputs, outputEncryptedNotes } = executionContext;
    return {
      proof: {
        a: { X: proof.proof.a[0], Y: proof.proof.a[1] },
        b: { X: proof.proof.b[0], Y: proof.proof.b[1] },
        c: { X: proof.proof.c[0], Y: proof.proof.c[1] },
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
      relayerAddress: options.gasRelayerAddress || MAIN_ASSET_ADDRESS,
      outEncryptedNotes: outputEncryptedNotes.map(toHex),
    };
  }

  private static signRequest(
    executionContext: ExecutionContextWithProof,
    request: ICommitmentPool.TransactRequestStruct,
  ): Promise<string> {
    const { publicRecipient, relayerAddress } = request;
    const { randomEtherWallet, outputEncryptedNotes } = executionContext;
    const bytes = Buffer.concat([toBuff(publicRecipient), toBuff(relayerAddress), ...outputEncryptedNotes]);
    return randomEtherWallet.signMessage(toBuff(ethers.utils.keccak256(bytes)));
  }

  private getInputAccounts(executionContext: ExecutionContext): Promise<Account[]> {
    const { selectedCommitments } = executionContext;
    const accountPromises: Promise<Account>[] = [];
    for (let i = 0; i < selectedCommitments.length; i += 1) {
      const commitment = selectedCommitments[i];
      const { commitmentHash, shieldedAddress } = commitment;
      if (!shieldedAddress) {
        return createErrorPromise(
          `missing required data of input commitment=${commitmentHash}`,
          MystikoErrorCode.CORRUPTED_COMMITMENT_DATA,
        );
      }
      accountPromises.push(
        this.context.accounts.findOne(shieldedAddress).then((account) => {
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
}
