import { AssetType, BridgeType, ChainConfig, DepositContractConfig } from '@mystikonetwork/config';
import { MystikoContractFactory, MystikoV2Bridge, MystikoV2Loop } from '@mystikonetwork/contracts-abi';
import { CommitmentStatus, CommitmentType, Deposit, DepositStatus } from '@mystikonetwork/database';
import { checkSigner } from '@mystikonetwork/ethers';
import { MystikoProtocolV2 } from '@mystikonetwork/protocol';
import { errorMessage, toBN, toDecimals, toHex, waitTransaction } from '@mystikonetwork/utils';
import { ContractTransaction } from 'ethers';
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

export class DepositExecutorV2 extends MystikoExecutor implements DepositExecutor {
  public execute(options: DepositOptions, config: DepositContractConfig): Promise<DepositResponse> {
    return this.getChainConfig(options)
      .then((chainConfig) => this.validateOptions(options, config, chainConfig).then(() => chainConfig))
      .then((chainConfig) => this.validateSigner(options).then(() => chainConfig))
      .then((chainConfig) => this.validateBalance(options, config, chainConfig).then(() => chainConfig))
      .then((chainConfig) =>
        this.createDeposit(options, config, chainConfig).then((deposit) => ({ deposit, chainConfig })),
      )
      .then(({ deposit, chainConfig }) => {
        const depositPromise = this.assetApprove(options, config, chainConfig, deposit)
          .then((newDeposit) => this.sendDeposit(options, config, chainConfig, newDeposit))
          .then((newDeposit) => this.createCommitment(options, config, chainConfig, newDeposit))
          .catch((error) => {
            const errorMsg = errorMessage(error);
            this.logger.error(`deposit id=${deposit.id} failed: ${errorMsg}`);
            return this.updateDepositStatus(options, deposit, DepositStatus.FAILED, {
              errorMessage: errorMsg,
            });
          });
        return { deposit, depositPromise };
      });
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
    return this.getChainConfig(options)
      .then((chainConfig) => this.validateOptions(options, config, chainConfig).then(() => chainConfig))
      .then((chainConfig) => {
        const totals: { [key: string]: number } = {
          [config.assetSymbol]: options.amount + options.rollupFee + (options.executorFee || 0),
        };
        if (chainConfig.assetSymbol === config.assetSymbol) {
          totals[config.assetSymbol] += options.bridgeFee || 0;
        } else {
          totals[chainConfig.assetSymbol] = options.bridgeFee || 0;
        }
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
          bridgeFeeAssetSymbol: chainConfig.assetSymbol,
          executorFee: options.executorFee || 0,
          executorFeeAssetSymbol: config.assetSymbol,
          totals,
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

  private validateOptions(
    options: DepositOptions,
    config: DepositContractConfig,
    chainConfig: ChainConfig,
  ): Promise<void> {
    if (!this.context.protocol.isShieldedAddress(options.shieldedAddress)) {
      return createErrorPromise(
        `address ${options.shieldedAddress} is an invalid Mystiko address`,
        MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
      );
    }
    if (toDecimals(options.amount, config.assetDecimals).lt(config.minAmount)) {
      return createErrorPromise(
        `deposit amount cannot be less than ${config.minAmountNumber}`,
        MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
      );
    }
    if (toDecimals(options.rollupFee, config.assetDecimals).lt(config.minRollupFee)) {
      return createErrorPromise(
        `rollup fee cannot be less than ${config.minRollupFeeNumber}`,
        MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
      );
    }
    if (options.bridge !== BridgeType.LOOP) {
      if (toDecimals(options.bridgeFee || 0, chainConfig.assetDecimals).lt(config.minBridgeFee)) {
        return createErrorPromise(
          `bridge fee cannot be less than ${config.minBridgeFeeNumber}`,
          MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
        );
      }
      if (toDecimals(options.executorFee || 0, chainConfig.assetDecimals).lt(config.minExecutorFee)) {
        return createErrorPromise(
          `executor fee cannot be less than ${config.minExecutorFeeNumber}`,
          MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
        );
      }
    }
    return Promise.resolve();
  }

  private validateSigner(options: DepositOptions): Promise<void> {
    return checkSigner(options.signer, options.srcChainId, this.config);
  }

  private validateBalance(
    options: DepositOptions,
    config: DepositContractConfig,
    chainConfig: ChainConfig,
  ): Promise<void> {
    const { signer } = options.signer;
    return signer.getAddress().then((address) => {
      let mainAssetBalance = toBN(0);
      let depositAssetBalance = toBN(0);
      if (config.assetType === AssetType.ERC20) {
        depositAssetBalance = depositAssetBalance
          .add(toDecimals(options.amount, config.assetDecimals))
          .add(toDecimals(options.rollupFee, config.assetDecimals))
          .add(toDecimals(options.executorFee || 0, config.assetDecimals));
        mainAssetBalance = mainAssetBalance.add(
          toDecimals(options.bridgeFee || 0, chainConfig.assetDecimals),
        );
      } else {
        depositAssetBalance = depositAssetBalance
          .add(toDecimals(options.amount, config.assetDecimals))
          .add(toDecimals(options.rollupFee, config.assetDecimals))
          .add(toDecimals(options.executorFee || 0, config.assetDecimals))
          .add(toDecimals(options.bridgeFee || 0, chainConfig.assetDecimals));
      }
      const balancePromises: Promise<void>[] = [];
      if (mainAssetBalance.gtn(0)) {
        balancePromises.push(
          this.context.executors
            .getAssetExecutor()
            .balance({
              chainId: options.srcChainId,
              assetSymbol: chainConfig.assetSymbol,
              assetDecimals: chainConfig.assetDecimals,
              address,
            })
            .then((balance) => {
              if (mainAssetBalance.gt(toBN(balance))) {
                return createErrorPromise(
                  `insufficient balance of asset ${chainConfig.assetSymbol}`,
                  MystikoErrorCode.INSUFFICIENT_BALANCE,
                );
              }
              return Promise.resolve();
            }),
        );
      }
      if (depositAssetBalance.gtn(0)) {
        balancePromises.push(
          this.context.executors
            .getAssetExecutor()
            .balance({
              chainId: options.srcChainId,
              assetAddress: config.assetAddress,
              assetSymbol: chainConfig.assetSymbol,
              assetDecimals: chainConfig.assetDecimals,
              address,
            })
            .then((balance) => {
              if (depositAssetBalance.gt(toBN(balance))) {
                return createErrorPromise(
                  `insufficient balance of asset ${config.assetSymbol}`,
                  MystikoErrorCode.INSUFFICIENT_BALANCE,
                );
              }
              return Promise.resolve();
            }),
        );
      }
      return Promise.all(balancePromises).then(() => {});
    });
  }

  private createDeposit(
    options: DepositOptions,
    config: DepositContractConfig,
    chainConfig: ChainConfig,
  ): Promise<Deposit> {
    const amount = toDecimals(options.amount, config.assetDecimals);
    return this.context.wallets.checkCurrent().then((wallet) =>
      (this.protocol as MystikoProtocolV2)
        .commitmentWithShieldedAddress(options.shieldedAddress, amount)
        .then((commitment) =>
          this.context.deposits
            .findOne({
              chainId: chainConfig.chainId,
              contractAddress: config.address,
              commitmentHash: commitment.commitmentHash.toString(),
            })
            .then((existingDeposit) => {
              if (!existingDeposit) {
                return commitment;
              }
              return createErrorPromise(
                `duplicate deposit commitment ${commitment.commitmentHash.toString()} ` +
                  `of chain id=${chainConfig.chainId} contract address=${config.address}`,
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
            contractAddress: config.address,
            commitmentHash: commitment.commitmentHash.toString(),
            hashK: commitment.k.toString(),
            randomS: commitment.randomS.toString(),
            encryptedNote: toHex(commitment.privateNote),
            assetSymbol: config.assetSymbol,
            assetDecimals: config.assetDecimals,
            assetAddress: config.assetAddress,
            bridgeType: config.bridgeType,
            amount: amount.toString(),
            rollupFeeAmount: toDecimals(options.rollupFee, config.assetDecimals).toString(),
            bridgeFeeAmount: toDecimals(options.bridgeFee || 0, chainConfig.assetDecimals).toString(),
            executorFeeAmount: toDecimals(options.executorFee || 0, config.assetDecimals).toString(),
            shieldedRecipientAddress: options.shieldedAddress,
            status: DepositStatus.INIT,
            wallet: wallet.id,
          });
        }),
    );
  }

  private assetApprove(
    options: DepositOptions,
    config: DepositContractConfig,
    chainConfig: ChainConfig,
    deposit: Deposit,
  ): Promise<Deposit> {
    let promise: Promise<Deposit>;
    if (config.assetType !== AssetType.MAIN && config.assetAddress) {
      const approveAmount = toDecimals(options.amount, config.assetDecimals)
        .add(toDecimals(options.rollupFee, config.assetDecimals))
        .add(toDecimals(options.executorFee || 0, config.assetDecimals));
      promise = this.context.executors
        .getAssetExecutor()
        .approve({
          chainId: chainConfig.chainId,
          assetAddress: config.assetAddress,
          assetSymbol: config.assetSymbol,
          assetDecimals: config.assetDecimals,
          amount: approveAmount.toString(),
          spender: config.address,
          signer: options.signer,
        })
        .then((resp) => {
          if (resp) {
            return this.updateDepositStatus(options, deposit, DepositStatus.ASSET_APPROVING, {
              assetApproveTransactionHash: resp.hash,
            }).then((depositWithHash) => waitTransaction(resp).then(() => depositWithHash));
          }
          return deposit;
        });
    } else {
      promise = Promise.resolve(deposit);
    }
    return promise.then((depositApproved) =>
      this.updateDepositStatus(options, depositApproved, DepositStatus.ASSET_APPROVED),
    );
  }

  private sendDeposit(
    options: DepositOptions,
    config: DepositContractConfig,
    chainConfig: ChainConfig,
    deposit: Deposit,
  ): Promise<Deposit> {
    let mainAssetAmount = toDecimals(options.bridgeFee || 0, chainConfig.assetDecimals);
    if (config.assetType === AssetType.MAIN) {
      mainAssetAmount = mainAssetAmount
        .add(toDecimals(options.amount, config.assetDecimals))
        .add(toDecimals(options.rollupFee, config.assetDecimals))
        .add(toDecimals(options.executorFee || 0, config.assetDecimals));
    }
    let promise: Promise<ContractTransaction>;
    if (config.bridgeType === BridgeType.LOOP) {
      const contract = MystikoContractFactory.connect<MystikoV2Loop>(
        'MystikoV2Loop',
        config.address,
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
        { value: mainAssetAmount.toString() },
      );
    } else {
      const contract = MystikoContractFactory.connect<MystikoV2Bridge>(
        'MystikoV2Bridge',
        config.address,
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
        { value: mainAssetAmount.toString() },
      );
    }
    this.logger.info(`submitting transaction of deposit id=${deposit.id} options=${JSON.stringify(options)}`);
    return promise
      .then((resp) => {
        this.logger.info(`transaction of deposit id=${deposit.id} has been submitted`);
        return this.updateDepositStatus(options, deposit, DepositStatus.SRC_PENDING, {
          transactionHash: resp.hash,
        }).then((newDeposit) => waitTransaction(resp).then(() => newDeposit));
      })
      .then((newDeposit) => {
        if (config.bridgeType === BridgeType.LOOP) {
          this.logger.info(
            `transaction of deposit id=${newDeposit.id} ` +
              `has been confirmed on source chain id=${chainConfig.chainId}`,
          );
          return this.updateDepositStatus(options, newDeposit, DepositStatus.QUEUED);
        }
        this.logger.info(
          `transaction of deposit id=${newDeposit.id} ` +
            `has been queued on chain id=${chainConfig.chainId}`,
        );
        return this.updateDepositStatus(options, newDeposit, DepositStatus.SRC_SUCCEEDED);
      });
  }

  private createCommitment(
    options: DepositOptions,
    config: DepositContractConfig,
    chainConfig: ChainConfig,
    deposit: Deposit,
  ): Promise<Deposit> {
    const now = MystikoHandler.now();
    const rawCommitment: CommitmentType = {
      id: MystikoHandler.generateId(),
      createdAt: now,
      updatedAt: now,
      chainId: options.dstChainId,
      contractAddress: config.peerContractAddress || config.address,
      assetSymbol: config.peerContract?.assetSymbol || config.assetSymbol,
      assetDecimals: config.peerContract?.assetDecimals || config.assetDecimals,
      assetAddress: config.peerContract?.assetAddress || config.assetAddress,
      bridgeType: config.bridgeType,
      status:
        config.bridgeType === BridgeType.LOOP ? CommitmentStatus.QUEUED : CommitmentStatus.SRC_SUCCEEDED,
      commitmentHash: deposit.commitmentHash,
      rollupFeeAmount: deposit.rollupFeeAmount,
      encryptedNote: deposit.encryptedNote,
      amount: deposit.amount,
      shieldedAddress: deposit.shieldedRecipientAddress,
      srcChainId: chainConfig.chainId,
      srcChainContractAddress: config.address,
      srcAssetSymbol: config.assetSymbol,
      srcAssetDecimals: config.assetDecimals,
      srcAssetAddress: config.assetAddress,
      creationTransactionHash: deposit.transactionHash,
    };
    return this.context.commitments
      .findOne({
        chainId: options.dstChainId,
        contractAddress: config.peerContractAddress || config.address,
        commitmentHash: deposit.commitmentHash,
      })
      .then((commitment) => {
        if (!commitment) {
          return this.db.commitments.insert(rawCommitment).then(() => deposit);
        }
        return deposit;
      })
      .catch((error) => {
        this.logger.warn(`failed to insert commitment for deposit id=${deposit.id}: ${errorMessage(error)}`);
        return deposit;
      });
  }

  private updateDepositStatus(
    options: DepositOptions,
    deposit: Deposit,
    newStatus: DepositStatus,
    updateOptions?: DepositUpdate,
  ): Promise<Deposit> {
    const oldStatus = deposit.status as DepositStatus;
    const wrappedUpdateOptions = updateOptions || {};
    wrappedUpdateOptions.status = newStatus;
    return this.context.deposits.update(deposit.id, wrappedUpdateOptions).then((newDeposit) => {
      if (options.statusCallback) {
        try {
          options.statusCallback(deposit, oldStatus, newStatus);
        } catch (error) {
          this.logger.warn(`status callback execution failed: ${errorMessage(error)}`);
        }
      }
      return newDeposit;
    });
  }
}
