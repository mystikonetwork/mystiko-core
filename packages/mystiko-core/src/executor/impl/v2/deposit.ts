import {
  AssetConfig,
  AssetType,
  BridgeType,
  ChainConfig,
  DepositContractConfig,
} from '@mystikonetwork/config';
import { MystikoContractFactory, MystikoV2Bridge, MystikoV2Loop } from '@mystikonetwork/contracts-abi';
import { CommitmentStatus, CommitmentType, Deposit, DepositStatus } from '@mystikonetwork/database';
import { checkSigner } from '@mystikonetwork/ethers';
import { MystikoProtocolV2 } from '@mystikonetwork/protocol';
import { errorMessage, fromDecimals, toBN, toDecimals, toHex, waitTransaction } from '@mystikonetwork/utils';
import { ContractTransaction, ethers } from 'ethers';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import { MystikoHandler } from '../../../handler';
import {
  DepositExecutor,
  DepositOptions,
  DepositQuote,
  DepositQuoteOptions,
  DepositResponse,
  DepositSummary,
  DepositUpdate,
} from '../../../interface';
import { MystikoExecutor } from '../../executor';

type AssetTotal = {
  asset: AssetConfig;
  total: string;
  totalNumber: number;
};

type ExecutionContext = {
  options: DepositOptions;
  contractConfig: DepositContractConfig;
  chainConfig: ChainConfig;
  amount: string;
  rollupFee: string;
  bridgeFee: string;
  executorFee: string;
  assetTotals: Map<string, AssetTotal>;
  mainAssetTotal: string;
};

type ExecutionContextWithDeposit = ExecutionContext & {
  deposit: Deposit;
};

export class DepositExecutorV2 extends MystikoExecutor implements DepositExecutor {
  public execute(options: DepositOptions, config: DepositContractConfig): Promise<DepositResponse> {
    return this.buildExecutionContext(options, config)
      .then((context) => this.validateOptions(context))
      .then((context) => this.validateSigner(context))
      .then((context) => this.validateBalance(context))
      .then((context) => this.createDeposit(context))
      .then((context) => ({ deposit: context.deposit, depositPromise: this.executeDeposit(context) }));
  }

  public quote(options: DepositQuoteOptions, config: DepositContractConfig): Promise<DepositQuote> {
    return this.getChainConfig(options).then((chainConfig) => ({
      minAmount: config.minAmountNumber,
      minRollupFeeAmount: config.minRollupFeeNumber,
      rollupFeeAssetSymbol: config.assetSymbol,
      minBridgeFeeAmount: config.minBridgeFeeNumber,
      bridgeFeeAssetSymbol: chainConfig.assetSymbol,
      minExecutorFeeAmount: config.minExecutorFeeNumber,
      executorFeeAssetSymbol: config.assetSymbol,
    }));
  }

  public summary(options: DepositOptions, config: DepositContractConfig): Promise<DepositSummary> {
    return this.buildExecutionContext(options, config)
      .then((context) => this.validateOptions(context))
      .then((context) => {
        const { assetTotals } = context;
        return {
          srcChainId: options.srcChainId,
          dstChainId: options.dstChainId,
          assetSymbol: options.assetSymbol,
          bridge: options.bridge,
          amount: options.amount,
          shieldedAddress: options.shieldedAddress,
          rollupFee: options.rollupFee,
          rollupFeeAssetSymbol: config.assetSymbol,
          bridgeFee: options.bridgeFee || 0,
          bridgeFeeAssetSymbol: config.bridgeFeeAsset.assetSymbol,
          executorFee: options.executorFee || 0,
          executorFeeAssetSymbol: config.executorFeeAsset.assetSymbol,
          totals: Array.from(assetTotals.values()).map((assetTotal) => ({
            assetSymbol: assetTotal.asset.assetSymbol,
            total: assetTotal.totalNumber,
          })),
        };
      });
  }

  private getChainConfig(options: DepositQuoteOptions | DepositOptions): Promise<ChainConfig> {
    const chainConfig = this.config.getChainConfig(options.srcChainId);
    if (!chainConfig) {
      return createErrorPromise(
        `no chain id=${options.srcChainId} configured`,
        MystikoErrorCode.NON_EXISTING_CHAIN,
      );
    }
    return Promise.resolve(chainConfig);
  }

  private buildExecutionContext(
    options: DepositOptions,
    contractConfig: DepositContractConfig,
  ): Promise<ExecutionContext> {
    return this.getChainConfig(options).then((chainConfig) => {
      let mainAssetTotal = toBN(0);
      const amount = toDecimals(options.amount, contractConfig.assetDecimals).toString();
      const rollupFee = toDecimals(options.rollupFee, contractConfig.assetDecimals).toString();
      const bridgeFee = toDecimals(
        options.bridgeFee || 0,
        contractConfig.bridgeFeeAsset.assetDecimals,
      ).toString();
      const executorFee = toDecimals(
        options.executorFee || 0,
        contractConfig.executorFeeAsset.assetDecimals,
      ).toString();
      const assetTotals = new Map<string, AssetTotal>();
      const assets: Array<{ asset: AssetConfig; amount: string }> = [
        { asset: contractConfig.asset, amount },
        { asset: contractConfig.asset, amount: rollupFee },
        { asset: contractConfig.bridgeFeeAsset, amount: bridgeFee },
        { asset: contractConfig.executorFeeAsset, amount: executorFee },
      ];
      assets.forEach((assetWithAmount) => {
        const { asset } = assetWithAmount;
        const amountBN = toBN(assetWithAmount.amount);
        if (asset.assetType === AssetType.MAIN) {
          mainAssetTotal = mainAssetTotal.add(amountBN);
        }
        const assetTotal = assetTotals.get(assetWithAmount.asset.assetAddress);
        if (assetTotal) {
          assetTotal.total = toBN(assetTotal.total).add(amountBN).toString();
          assetTotal.totalNumber += fromDecimals(assetWithAmount.amount, asset.assetDecimals);
        } else {
          assetTotals.set(assetWithAmount.asset.assetAddress, {
            asset: assetWithAmount.asset,
            total: assetWithAmount.amount,
            totalNumber: fromDecimals(assetWithAmount.amount, asset.assetDecimals),
          });
        }
      });
      return {
        options,
        contractConfig,
        chainConfig,
        amount,
        rollupFee,
        bridgeFee,
        executorFee,
        assetTotals,
        mainAssetTotal: mainAssetTotal.toString(),
      };
    });
  }

  private validateOptions(executionContext: ExecutionContext): Promise<ExecutionContext> {
    const { options, contractConfig, amount, rollupFee, bridgeFee, executorFee } = executionContext;
    if (!this.context.protocol.isShieldedAddress(options.shieldedAddress)) {
      return createErrorPromise(
        `address ${options.shieldedAddress} is an invalid Mystiko address`,
        MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
      );
    }
    if (toBN(amount).lt(contractConfig.minAmount)) {
      return createErrorPromise(
        `deposit amount cannot be less than ${contractConfig.minAmountNumber}`,
        MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
      );
    }
    if (toBN(rollupFee).lt(contractConfig.minRollupFee)) {
      return createErrorPromise(
        `rollup fee cannot be less than ${contractConfig.minRollupFeeNumber}`,
        MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
      );
    }
    if (options.bridge !== BridgeType.LOOP) {
      if (toBN(bridgeFee).lt(contractConfig.minBridgeFee)) {
        return createErrorPromise(
          `bridge fee cannot be less than ${contractConfig.minBridgeFeeNumber}`,
          MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
        );
      }
      if (toBN(executorFee).lt(contractConfig.minExecutorFee)) {
        return createErrorPromise(
          `executor fee cannot be less than ${contractConfig.minExecutorFeeNumber}`,
          MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
        );
      }
    }
    return Promise.resolve(executionContext);
  }

  private validateSigner(executionContext: ExecutionContext): Promise<ExecutionContext> {
    const { options } = executionContext;
    return checkSigner(options.signer, options.srcChainId, this.config).then(() => executionContext);
  }

  private validateBalance(executionContext: ExecutionContext): Promise<ExecutionContext> {
    const { options, assetTotals, chainConfig } = executionContext;
    const { signer } = options.signer;
    return signer.getAddress().then((signerAddress) => {
      const balancePromises: Promise<void>[] = [];
      assetTotals.forEach((assetTotal) => {
        const { asset, total } = assetTotal;
        const balancePromise: Promise<void> = this.context.executors
          .getAssetExecutor()
          .balance({
            chainId: chainConfig.chainId,
            assetAddress: asset.assetType !== AssetType.MAIN ? asset.assetAddress : undefined,
            assetSymbol: asset.assetSymbol,
            assetDecimals: asset.assetDecimals,
            address: signerAddress,
          })
          .then((balance) => {
            if (toBN(balance).lt(toBN(total))) {
              return createErrorPromise(
                `insufficient balance of asset=${asset.assetSymbol} on chain id=${chainConfig.chainId}`,
                MystikoErrorCode.INSUFFICIENT_BALANCE,
              );
            }
            return Promise.resolve();
          });
        balancePromises.push(balancePromise);
      });
      return Promise.all(balancePromises).then(() => executionContext);
    });
  }

  private createDeposit(executionContext: ExecutionContext): Promise<ExecutionContextWithDeposit> {
    const { options, contractConfig, chainConfig, amount, rollupFee, bridgeFee, executorFee } =
      executionContext;
    return this.context.wallets.checkCurrent().then((wallet) =>
      (this.protocol as MystikoProtocolV2)
        .commitmentWithShieldedAddress(options.shieldedAddress, toBN(amount))
        .then((commitment) =>
          this.context.deposits
            .findOne({
              chainId: chainConfig.chainId,
              contractAddress: contractConfig.address,
              commitmentHash: commitment.commitmentHash.toString(),
            })
            .then((existingDeposit) => {
              if (!existingDeposit) {
                return commitment;
              }
              return createErrorPromise(
                `duplicate deposit commitment ${commitment.commitmentHash.toString()} ` +
                  `of chain id=${chainConfig.chainId} contract address=${contractConfig.address}`,
                MystikoErrorCode.DUPLICATE_DEPOSIT_COMMITMENT,
              );
            }),
        )
        .then((commitment) => {
          const now = MystikoHandler.now();
          return this.db.deposits.insert({
            id: MystikoHandler.generateId(),
            createdAt: now,
            updatedAt: now,
            chainId: chainConfig.chainId,
            contractAddress: contractConfig.address,
            commitmentHash: commitment.commitmentHash.toString(),
            hashK: commitment.k.toString(),
            randomS: commitment.randomS.toString(),
            encryptedNote: toHex(commitment.privateNote),
            assetSymbol: contractConfig.assetSymbol,
            assetDecimals: contractConfig.assetDecimals,
            assetAddress: contractConfig.assetAddress,
            bridgeType: contractConfig.bridgeType,
            amount,
            rollupFeeAmount: rollupFee,
            bridgeFeeAmount: bridgeFee,
            bridgeFeeAssetAddress: contractConfig.bridgeFeeAsset.assetAddress,
            executorFeeAmount: executorFee,
            executorFeeAssetAddress: contractConfig.executorFeeAsset.assetAddress,
            shieldedRecipientAddress: options.shieldedAddress,
            status: DepositStatus.INIT,
            wallet: wallet.id,
          });
        })
        .then((deposit) => ({ ...executionContext, deposit })),
    );
  }

  private assetApprove(executionContext: ExecutionContextWithDeposit): Promise<ExecutionContextWithDeposit> {
    const { options, contractConfig, chainConfig, deposit, assetTotals } = executionContext;
    const approvePromises: Promise<ethers.providers.TransactionReceipt | undefined>[] = [];
    assetTotals.forEach((assetTotal) => {
      const { asset, total } = assetTotal;
      if (asset.assetType !== AssetType.MAIN) {
        const approvePromise = this.context.executors
          .getAssetExecutor()
          .approve({
            chainId: chainConfig.chainId,
            assetAddress: asset.assetAddress,
            assetSymbol: asset.assetSymbol,
            assetDecimals: asset.assetDecimals,
            spender: contractConfig.address,
            signer: options.signer,
            amount: total,
          })
          .then((resp) =>
            this.updateDepositStatus(options, deposit, DepositStatus.ASSET_APPROVING, {
              assetApproveTransactionHash: resp?.hash,
            }).then(() => {
              if (resp) {
                return waitTransaction(resp);
              }
              return Promise.resolve(undefined);
            }),
          );
        approvePromises.push(approvePromise);
      }
    });
    return Promise.all(approvePromises)
      .then((receipts) => {
        let transactionHash: string | undefined;
        for (let i = 0; i < receipts.length; i += 1) {
          const receipt = receipts[i];
          if (receipt) {
            transactionHash = receipt.transactionHash;
            break;
          }
        }
        return this.updateDepositStatus(options, deposit, DepositStatus.ASSET_APPROVED, {
          assetApproveTransactionHash: transactionHash,
        });
      })
      .then((newDeposit) => ({ ...executionContext, deposit: newDeposit }));
  }

  private sendDeposit(executionContext: ExecutionContextWithDeposit): Promise<ExecutionContextWithDeposit> {
    const { options, contractConfig, chainConfig, deposit, mainAssetTotal } = executionContext;
    let promise: Promise<ContractTransaction>;
    if (contractConfig.bridgeType === BridgeType.LOOP) {
      const contract = MystikoContractFactory.connect<MystikoV2Loop>(
        'MystikoV2Loop',
        contractConfig.address,
        options.signer.signer,
      );
      promise = contract.deposit(
        {
          amount: deposit.amount,
          commitment: deposit.commitmentHash,
          hashK: deposit.hashK,
          randomS: deposit.randomS,
          encryptedNote: deposit.encryptedNote,
          rollupFee: deposit.rollupFeeAmount,
        },
        { value: mainAssetTotal },
      );
    } else {
      const contract = MystikoContractFactory.connect<MystikoV2Bridge>(
        'MystikoV2Bridge',
        contractConfig.address,
        options.signer.signer,
      );
      promise = contract.deposit(
        {
          amount: deposit.amount,
          commitment: deposit.commitmentHash,
          hashK: deposit.hashK,
          randomS: deposit.randomS,
          encryptedNote: deposit.encryptedNote,
          rollupFee: deposit.rollupFeeAmount,
          bridgeFee: deposit.bridgeFeeAmount,
          executorFee: deposit.executorFeeAmount,
        },
        { value: mainAssetTotal },
      );
    }
    this.logger.info(`submitting transaction of deposit id=${deposit.id}`);
    return promise
      .then((resp) => {
        this.logger.info(`transaction of deposit id=${deposit.id} has been submitted`);
        return this.updateDepositStatus(options, deposit, DepositStatus.SRC_PENDING, {
          transactionHash: resp.hash,
        }).then((newDeposit) => waitTransaction(resp).then((receipt) => ({ newDeposit, receipt })));
      })
      .then(({ newDeposit, receipt }) => {
        if (contractConfig.bridgeType === BridgeType.LOOP) {
          this.logger.info(
            `transaction of deposit id=${newDeposit.id} ` +
              `has been confirmed on source chain id=${chainConfig.chainId}`,
          );
          return this.updateDepositStatus(options, newDeposit, DepositStatus.QUEUED, {
            transactionHash: receipt.transactionHash,
          });
        }
        this.logger.info(
          `transaction of deposit id=${newDeposit.id} ` +
            `has been queued on chain id=${chainConfig.chainId}`,
        );
        return this.updateDepositStatus(options, newDeposit, DepositStatus.SRC_SUCCEEDED, {
          transactionHash: receipt.transactionHash,
        });
      })
      .then((newDeposit) => ({ ...executionContext, deposit: newDeposit }));
  }

  private executeDeposit(executionContext: ExecutionContextWithDeposit): Promise<Deposit> {
    const { options, deposit } = executionContext;
    return this.assetApprove(executionContext)
      .then((newContext) => this.sendDeposit(newContext))
      .then((newContext) => this.createCommitment(newContext))
      .then((newContext) => newContext.deposit)
      .catch((error) => {
        const errorMsg = errorMessage(error);
        this.logger.error(`deposit id=${deposit.id} failed: ${errorMsg}`);
        return this.updateDepositStatus(options, deposit, DepositStatus.FAILED, {
          errorMessage: errorMsg,
        });
      });
  }

  private createCommitment(
    executionContext: ExecutionContextWithDeposit,
  ): Promise<ExecutionContextWithDeposit> {
    const { options, contractConfig, chainConfig, deposit } = executionContext;
    const now = MystikoHandler.now();
    const rawCommitment: CommitmentType = {
      id: MystikoHandler.generateId(),
      createdAt: now,
      updatedAt: now,
      chainId: options.dstChainId,
      contractAddress: contractConfig.peerContract?.poolAddress || contractConfig.poolAddress,
      assetSymbol: contractConfig.peerContract?.assetSymbol || contractConfig.assetSymbol,
      assetDecimals: contractConfig.peerContract?.assetDecimals || contractConfig.assetDecimals,
      assetAddress: contractConfig.peerContract?.assetAddress || contractConfig.assetAddress,
      bridgeType: contractConfig.bridgeType,
      status:
        contractConfig.bridgeType === BridgeType.LOOP
          ? CommitmentStatus.QUEUED
          : CommitmentStatus.SRC_SUCCEEDED,
      commitmentHash: deposit.commitmentHash,
      rollupFeeAmount: deposit.rollupFeeAmount,
      encryptedNote: deposit.encryptedNote,
      amount: deposit.amount,
      shieldedAddress: deposit.shieldedRecipientAddress,
      srcChainId: chainConfig.chainId,
      srcChainContractAddress: contractConfig.poolAddress,
      srcAssetSymbol: contractConfig.assetSymbol,
      srcAssetDecimals: contractConfig.assetDecimals,
      srcAssetAddress: contractConfig.assetAddress,
      creationTransactionHash: deposit.transactionHash,
    };
    return this.context.commitments
      .findOne({
        chainId: options.dstChainId,
        contractAddress: contractConfig.peerContractAddress || contractConfig.address,
        commitmentHash: deposit.commitmentHash,
      })
      .then((commitment) => {
        if (!commitment) {
          return this.db.commitments.insert(rawCommitment).then(() => executionContext);
        }
        return executionContext;
      })
      .catch((error) => {
        this.logger.warn(`failed to insert commitment for deposit id=${deposit.id}: ${errorMessage(error)}`);
        return executionContext;
      });
  }

  private updateDepositStatus(
    options: DepositOptions,
    deposit: Deposit,
    newStatus: DepositStatus,
    updateOptions?: DepositUpdate,
  ): Promise<Deposit> {
    const oldStatus = deposit.status as DepositStatus;
    if (oldStatus !== newStatus && updateOptions) {
      const wrappedUpdateOptions: DepositUpdate = updateOptions || {};
      wrappedUpdateOptions.status = newStatus;
      return this.context.deposits.update(deposit.id, wrappedUpdateOptions).then((newDeposit) => {
        if (options.statusCallback && oldStatus !== newStatus) {
          try {
            options.statusCallback(newDeposit, oldStatus, newStatus);
          } catch (error) {
            this.logger.warn(`status callback execution failed: ${errorMessage(error)}`);
          }
        }
        return newDeposit;
      });
    }
    return Promise.resolve(deposit);
  }
}
