import {
  AssetConfig,
  AssetType,
  BridgeType,
  ChainConfig,
  DepositContractConfig,
} from '@mystikonetwork/config';
import { CommitmentPool, MystikoV2Bridge, MystikoV2Loop } from '@mystikonetwork/contracts-abi';
import {
  Commitment,
  CommitmentStatus,
  CommitmentType,
  Deposit,
  DepositStatus,
} from '@mystikonetwork/database';
import { checkSigner } from '@mystikonetwork/ethers';
import { CommitmentOutput, MystikoProtocolV2 } from '@mystikonetwork/protocol';
import {
  errorMessage,
  fromDecimals,
  toBN,
  toBuff,
  toDecimals,
  toHex,
  waitTransaction,
} from '@mystikonetwork/utils';
import BN from 'bn.js';
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
  serviceFee: string;
  assetTotals: Map<string, AssetTotal>;
  mainAssetTotal: string;
};

type ExecutionContextWithDeposit = ExecutionContext & {
  deposit: Deposit;
};

type ScreeningOptions = {
  enabled: boolean;
  deadline: number;
  signature: string;
};

type ExecutionContextWithScreening = ExecutionContextWithDeposit & {
  cert: ScreeningOptions;
};

type RemoteContractConfig = {
  minRollupFee: BN;
};

const DEFAULT_WAIT_TIMEOUT_MS = 120000;
const SCREENING_MESSAGE = 'Mystiko Deposit Address Screening';

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
    return this.fetchRemoteContractConfig(options, config).then(({ minRollupFee }) => ({
      minAmount: config.minAmountNumber,
      maxAmount: config.maxAmountNumber,
      minRollupFeeAmount: fromDecimals(minRollupFee, config.assetDecimals),
      rollupFeeAssetSymbol: config.assetSymbol,
      minBridgeFeeAmount: config.minBridgeFeeNumber,
      bridgeFeeAssetSymbol: config.bridgeFeeAsset.assetSymbol,
      minExecutorFeeAmount: config.minExecutorFeeNumber,
      executorFeeAssetSymbol: config.executorFeeAsset.assetSymbol,
      recommendedAmounts: config.recommendedAmountsNumber.filter(
        (amount) => amount >= config.minAmountNumber && amount <= config.maxAmountNumber,
      ),
    }));
  }

  public summary(options: DepositOptions, config: DepositContractConfig): Promise<DepositSummary> {
    return this.buildExecutionContext(options, config)
      .then((context) => this.validateOptions(context))
      .then((context) => {
        const { assetTotals, serviceFee } = context;
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
          serviceFeeRatio: config.serviceFee / config.serviceFeeDivider,
          serviceFee: fromDecimals(serviceFee, config.assetDecimals),
          serviceFeeAssetSymbol: config.assetSymbol,
          totals: Array.from(assetTotals.values()).map((assetTotal) => ({
            assetSymbol: assetTotal.asset.assetSymbol,
            total: assetTotal.totalNumber,
          })),
        };
      });
  }

  public async fixStatus(deposit: Deposit): Promise<Deposit> {
    const provider = await this.context.providers.checkProvider(deposit.dstChainId);
    const etherContract = this.context.contractConnector.connect<CommitmentPool>(
      'CommitmentPool',
      deposit.dstPoolAddress,
      provider,
    );
    const commitment = await this.context.commitments.findOne({
      chainId: deposit.dstChainId,
      contractAddress: deposit.dstPoolAddress,
      commitmentHash: deposit.commitmentHash,
    });
    const isHistoricCommitment = await etherContract.isHistoricCommitment(deposit.commitmentHash);
    if (
      isHistoricCommitment &&
      deposit.status !== DepositStatus.QUEUED &&
      deposit.status !== DepositStatus.INCLUDED
    ) {
      if (commitment != null) {
        await commitment.atomicUpdate((data) => {
          data.status =
            data.rollupTransactionHash !== undefined ? CommitmentStatus.INCLUDED : CommitmentStatus.QUEUED;
          data.updatedAt = MystikoHandler.now();
          return data;
        });
      }
      return deposit.atomicUpdate((data) => {
        data.status =
          commitment === null || commitment.rollupTransactionHash === undefined
            ? DepositStatus.QUEUED
            : DepositStatus.INCLUDED;
        data.errorMessage = undefined;
        data.updatedAt = MystikoHandler.now();
        return data;
      });
    }
    if (
      !isHistoricCommitment &&
      deposit.bridgeType === BridgeType.LOOP &&
      (deposit.status === DepositStatus.QUEUED ||
        deposit.status === DepositStatus.INCLUDED ||
        deposit.status === DepositStatus.SRC_PENDING)
    ) {
      if (commitment != null) {
        await commitment.atomicUpdate((data) => {
          data.status = CommitmentStatus.FAILED;
          data.updatedAt = MystikoHandler.now();
          return data;
        });
      }
      return deposit.atomicUpdate((data) => {
        data.status = DepositStatus.FAILED;
        data.errorMessage = undefined;
        data.updatedAt = MystikoHandler.now();
        return data;
      });
    }
    return deposit;
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
    return DepositExecutorV2.validateNumbers(options)
      .then(() => this.getChainConfig(options))
      .then((chainConfig) => {
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
        const serviceFee = toDecimals(options.amount, contractConfig.assetDecimals)
          .muln(contractConfig.serviceFee)
          .divn(contractConfig.serviceFeeDivider)
          .toString();
        const assetTotals = new Map<string, AssetTotal>();
        const assets: Array<{ asset: AssetConfig; amount: string }> = [
          { asset: contractConfig.asset, amount },
          { asset: contractConfig.asset, amount: rollupFee },
          { asset: contractConfig.bridgeFeeAsset, amount: bridgeFee },
          { asset: contractConfig.executorFeeAsset, amount: executorFee },
          { asset: contractConfig.asset, amount: serviceFee },
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
          serviceFee,
          assetTotals,
          mainAssetTotal: mainAssetTotal.toString(),
        };
      });
  }

  private validateOptions(executionContext: ExecutionContext): Promise<ExecutionContext> {
    const { options, contractConfig, chainConfig, amount, rollupFee, bridgeFee, executorFee } =
      executionContext;
    return this.fetchRemoteContractConfig(options, contractConfig).then(({ minRollupFee }) => {
      if (
        !chainConfig.getDepositContractByAddress(contractConfig.address) ||
        options.dstChainId !== (contractConfig.peerChainId || chainConfig.chainId) ||
        options.bridge !== contractConfig.bridgeType ||
        options.assetSymbol !== contractConfig.assetSymbol
      ) {
        return createErrorPromise(
          'options mismatch with given contract config',
          MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
        );
      }
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
      if (toBN(amount).gt(contractConfig.maxAmount)) {
        return createErrorPromise(
          `deposit amount cannot be greater than ${contractConfig.maxAmountNumber}`,
          MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
        );
      }
      if (toBN(rollupFee).lt(minRollupFee)) {
        return createErrorPromise(
          `rollup fee cannot be less than ${fromDecimals(minRollupFee, contractConfig.assetDecimals)}`,
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
      } else {
        if (!toBN(bridgeFee).isZero()) {
          return createErrorPromise(
            'bridge fee should be zero when depositing to loop contract',
            MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
          );
        }
        if (!toBN(executorFee).isZero()) {
          return createErrorPromise(
            'executor fee should be zero when depositing to loop contract',
            MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
          );
        }
      }
      return executionContext;
    });
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

  private async addressScreening(
    executionContext: ExecutionContextWithDeposit,
  ): Promise<ExecutionContextWithScreening> {
    const { options, contractConfig } = executionContext;

    if (!this.isAddressScreeningRequired(contractConfig)) {
      return {
        ...executionContext,
        cert: {
          enabled: false,
        },
      } as ExecutionContextWithScreening;
    }

    await this.updateDepositStatus(options, executionContext.deposit, DepositStatus.ADDRESS_SCREENING);

    const account = await options.signer.signer.getAddress();
    const signature = await options.signer.signMessage(account, SCREENING_MESSAGE);
    const rsp = await this.context.screening.applyCertificate({
      chainId: options.srcChainId,
      account,
      message: SCREENING_MESSAGE,
      signature,
      asset: contractConfig.assetAddress,
    });

    await this.updateDepositStatus(options, executionContext.deposit, DepositStatus.ADDRESS_SCREENED);

    return {
      ...executionContext,
      cert: {
        enabled: true,
        deadline: rsp.deadline,
        signature: rsp.signature,
      },
    } as ExecutionContextWithScreening;
  }

  private createDeposit(executionContext: ExecutionContext): Promise<ExecutionContextWithDeposit> {
    const { options, contractConfig, chainConfig, amount, rollupFee, bridgeFee, executorFee, serviceFee } =
      executionContext;
    return this.context.wallets.checkCurrent().then((wallet) =>
      (this.protocol as MystikoProtocolV2)
        .commitment({ publicKeys: options.shieldedAddress, amount: toBN(amount) })
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
              /* istanbul ignore next */
              return createErrorPromise(
                `duplicate deposit commitment ${commitment.commitmentHash.toString()} ` +
                  `of chain id=${chainConfig.chainId} contract address=${contractConfig.address}`,
                MystikoErrorCode.DUPLICATE_DEPOSIT_COMMITMENT,
              );
            }),
        )
        .then((commitment: CommitmentOutput) => {
          const now = MystikoHandler.now();
          return this.db.deposits.insert({
            id: MystikoHandler.generateId(),
            createdAt: now,
            updatedAt: now,
            chainId: chainConfig.chainId,
            contractAddress: contractConfig.address,
            poolAddress: contractConfig.poolAddress,
            commitmentHash: commitment.commitmentHash.toString(),
            hashK: commitment.k.toString(),
            randomS: commitment.randomS.toString(),
            encryptedNote: toHex(commitment.encryptedNote),
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
            serviceFeeAmount: serviceFee,
            shieldedRecipientAddress: options.shieldedAddress,
            dstChainId: contractConfig.peerChainId || chainConfig.chainId,
            dstChainContractAddress: contractConfig.peerContractAddress || contractConfig.address,
            dstPoolAddress: contractConfig.peerContract?.poolAddress || contractConfig.poolAddress,
            status: DepositStatus.INIT,
            wallet: wallet.id,
          });
        })
        .then((deposit) => ({ ...executionContext, deposit })),
    );
  }

  private async assetApprove(
    executionContext: ExecutionContextWithScreening,
  ): Promise<ExecutionContextWithScreening> {
    const { options, contractConfig, chainConfig, deposit, assetTotals } = executionContext;
    const approvePromises = Array.from(assetTotals.values()).map(async (assetTotal) => {
      const { asset, total } = assetTotal;
      if (asset.assetType !== AssetType.MAIN) {
        const resp = await this.context.executors.getAssetExecutor().approve({
          chainId: chainConfig.chainId,
          assetAddress: asset.assetAddress,
          assetSymbol: asset.assetSymbol,
          assetDecimals: asset.assetDecimals,
          spender: contractConfig.address,
          signer: options.signer.signer,
          amount: total,
          overrides: options.assetApproveOverrides,
        });
        await this.updateDepositStatus(options, deposit, DepositStatus.ASSET_APPROVING, {
          assetApproveTransactionHash: resp?.hash,
        });
        if (resp) {
          return waitTransaction(resp, undefined, options.waitTimeoutMs || DEFAULT_WAIT_TIMEOUT_MS)
            .then((receipt) => receipt.transactionHash)
            .catch(async (error) => {
              this.logger.warn(
                `waiting asset approve transaction(hash=${resp.hash}) failed: ${errorMessage(error)}`,
              );
              const address = await options.signer.signer.getAddress();
              const allowance = await this.context.executors.getAssetExecutor().allowance({
                chainId: chainConfig.chainId,
                assetAddress: asset.assetAddress,
                address,
                spender: contractConfig.address,
              });
              if (toBN(allowance).gte(toBN(total))) {
                return resp.hash;
              }
              return Promise.reject(error);
            });
        }
      }
      return Promise.resolve(undefined);
    });
    const transactionHashes = (await Promise.all(approvePromises)).filter((hash) => hash !== undefined);
    const transactionHash = transactionHashes.length > 0 ? transactionHashes[0] : undefined;
    const newDeposit = await this.updateDepositStatus(options, deposit, DepositStatus.ASSET_APPROVED, {
      assetApproveTransactionHash: transactionHash,
    });
    return { ...executionContext, deposit: newDeposit };
  }

  private async sendDeposit(
    executionContext: ExecutionContextWithScreening,
  ): Promise<ExecutionContextWithScreening> {
    const { options, contractConfig, chainConfig, deposit, mainAssetTotal, cert } = executionContext;

    const commitment = await this.createCommitment({ ...executionContext, deposit });
    let promise: Promise<ContractTransaction>;
    if (contractConfig.bridgeType === BridgeType.LOOP) {
      const contract = this.context.contractConnector.connect<MystikoV2Loop>(
        'MystikoV2Loop',
        contractConfig.address,
        options.signer.signer,
      );
      if (cert.enabled) {
        promise = contract.certDeposit(
          {
            amount: deposit.amount,
            commitment: deposit.commitmentHash,
            hashK: deposit.hashK,
            randomS: deposit.randomS,
            encryptedNote: deposit.encryptedNote,
            rollupFee: deposit.rollupFeeAmount,
          },
          cert.deadline,
          toBuff(cert.signature),
          { value: mainAssetTotal, ...options.depositOverrides },
        );
      } else {
        promise = contract.deposit(
          {
            amount: deposit.amount,
            commitment: deposit.commitmentHash,
            hashK: deposit.hashK,
            randomS: deposit.randomS,
            encryptedNote: deposit.encryptedNote,
            rollupFee: deposit.rollupFeeAmount,
          },
          { value: mainAssetTotal, ...options.depositOverrides },
        );
      }
    } else {
      const contract = this.context.contractConnector.connect<MystikoV2Bridge>(
        'MystikoV2Bridge',
        contractConfig.address,
        options.signer.signer,
      );
      if (cert.enabled) {
        promise = contract.certDeposit(
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
          cert.deadline,
          toBuff(cert.signature),
          { value: mainAssetTotal, ...options.depositOverrides },
        );
      } else {
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
          { value: mainAssetTotal, ...options.depositOverrides },
        );
      }
    }
    this.logger.info(`submitting transaction of deposit id=${deposit.id}`);
    const resp = await promise.catch(async (error) => {
      await commitment.atomicUpdate((commitmentData) => {
        commitmentData.status = CommitmentStatus.FAILED;
        commitmentData.updatedAt = MystikoHandler.now();
        return commitmentData;
      });
      return Promise.reject(error);
    });
    this.logger.info(
      `transaction of deposit id=${deposit.id} on chain id=${chainConfig.chainId} ` +
        `has been submitted, transaction hash=${resp.hash}`,
    );
    let newDeposit = await this.updateDepositStatus(options, deposit, DepositStatus.SRC_PENDING, {
      transactionHash: resp.hash,
    });
    await this.updateCommitment({ ...executionContext, deposit: newDeposit }, commitment, true);
    const transactionHash = await waitTransaction(
      resp,
      options.numOfConfirmations || chainConfig.safeConfirmations,
      options.waitTimeoutMs || DEFAULT_WAIT_TIMEOUT_MS,
    )
      .then((receipt) => receipt.transactionHash)
      .catch(async (error) => {
        this.logger.warn(`waiting deposit transaction(hash=${resp.hash}) failed: ${errorMessage(error)}`);
        const provider = await this.context.providers.checkProvider(newDeposit.dstChainId);
        const poolContract = this.context.contractConnector.connect<CommitmentPool>(
          'CommitmentPool',
          newDeposit.dstPoolAddress,
          provider,
        );
        if (await poolContract.isHistoricCommitment(newDeposit.commitmentHash)) {
          return resp.hash;
        }
        await commitment.atomicUpdate((commitmentData) => {
          commitmentData.status = CommitmentStatus.FAILED;
          commitmentData.updatedAt = MystikoHandler.now();
          return commitmentData;
        });
        return Promise.reject(error);
      });
    if (contractConfig.bridgeType === BridgeType.LOOP) {
      this.logger.info(
        `transaction of deposit id=${newDeposit.id} ` +
          `has been confirmed on source chain id=${chainConfig.chainId}`,
      );
      newDeposit = await this.updateDepositStatus(
        options,
        newDeposit,
        DepositStatus.QUEUED,
        {
          transactionHash,
        },
        DepositStatus.SRC_PENDING,
      );
    } else {
      this.logger.info(
        `transaction of deposit id=${newDeposit.id} has been queued on chain id=${chainConfig.chainId}`,
      );
      newDeposit = await this.updateDepositStatus(
        options,
        newDeposit,
        DepositStatus.SRC_SUCCEEDED,
        {
          transactionHash,
        },
        DepositStatus.SRC_PENDING,
      );
    }
    await this.updateCommitment({ ...executionContext, deposit: newDeposit }, commitment);
    return { ...executionContext, deposit: newDeposit };
  }

  private executeDeposit(executionContext: ExecutionContextWithDeposit): Promise<Deposit> {
    const { options, deposit } = executionContext;
    return this.addressScreening(executionContext)
      .then((newContext) => this.assetApprove(newContext))
      .then((newContext) => this.sendDeposit(newContext))
      .then((newContext) => newContext.deposit)
      .catch((error) => {
        const errorMsg = errorMessage(error);
        this.logger.error(`deposit id=${deposit.id} failed: ${errorMsg}`);
        return this.updateDepositStatus(options, deposit, DepositStatus.FAILED, {
          errorMessage: errorMsg,
        });
      });
  }

  private createCommitment(executionContext: ExecutionContextWithDeposit): Promise<Commitment> {
    const { options, contractConfig, deposit } = executionContext;
    const now = MystikoHandler.now();
    const rawCommitment: CommitmentType = {
      id: MystikoHandler.generateId(),
      createdAt: now,
      updatedAt: now,
      chainId: options.dstChainId,
      contractAddress: contractConfig.peerContract?.poolAddress || contractConfig.poolAddress,
      assetSymbol: contractConfig.peerContract?.assetSymbol || contractConfig.assetSymbol,
      assetDecimals: contractConfig.peerContract?.assetDecimals || contractConfig.assetDecimals,
      assetAddress: contractConfig.peerContract
        ? contractConfig.peerContract.assetAddress
        : contractConfig.assetAddress,
      status: CommitmentStatus.INIT,
      commitmentHash: deposit.commitmentHash,
      rollupFeeAmount: deposit.rollupFeeAmount,
      encryptedNote: deposit.encryptedNote,
      amount: deposit.amount,
      shieldedAddress: deposit.shieldedRecipientAddress,
    };
    return this.context.commitments
      .findOne({
        chainId: options.dstChainId,
        contractAddress: contractConfig.peerContractAddress || contractConfig.address,
        commitmentHash: deposit.commitmentHash,
      })
      .then((commitment) => {
        if (!commitment) {
          return this.db.commitments.insert(rawCommitment).then((insertedCommitment) => insertedCommitment);
        }
        /* istanbul ignore next */
        return commitment;
      });
  }

  private updateCommitment(
    context: ExecutionContextWithDeposit,
    commitment: Commitment,
    pending?: boolean,
  ): Promise<Commitment> {
    const { contractConfig, deposit } = context;
    return commitment.atomicUpdate((commitmentData) => {
      if (pending) {
        commitmentData.status = CommitmentStatus.SRC_PENDING;
      } else {
        commitmentData.status =
          contractConfig.bridgeType === BridgeType.LOOP
            ? CommitmentStatus.QUEUED
            : CommitmentStatus.SRC_SUCCEEDED;
      }
      commitmentData.creationTransactionHash =
        contractConfig.bridgeType === BridgeType.LOOP ? deposit.transactionHash : undefined;
      commitmentData.updatedAt = MystikoHandler.now();
      return commitmentData;
    });
  }

  private updateDepositStatus(
    options: DepositOptions,
    deposit: Deposit,
    newStatus: DepositStatus,
    updateOptions?: DepositUpdate,
    oldStatus?: DepositStatus,
  ): Promise<Deposit> {
    const wrappedOldStatus = oldStatus || (deposit.status as DepositStatus);
    if (wrappedOldStatus !== newStatus || updateOptions) {
      const wrappedUpdateOptions: DepositUpdate = updateOptions || {};
      wrappedUpdateOptions.status = newStatus;
      return this.context.deposits.update(deposit.id, wrappedUpdateOptions).then((newDeposit) => {
        if (options.statusCallback && wrappedOldStatus !== newStatus) {
          try {
            options.statusCallback(newDeposit, wrappedOldStatus, newStatus);
          } catch (error) {
            this.logger.warn(`status callback execution failed: ${errorMessage(error)}`);
          }
        }
        return newDeposit;
      });
    }
    /* istanbul ignore next */
    return Promise.resolve(deposit);
  }

  private fetchRemoteContractConfig(
    options: DepositOptions | DepositQuoteOptions,
    config: DepositContractConfig,
  ): Promise<RemoteContractConfig> {
    return this.context.providers
      .checkProvider(options.dstChainId)
      .then((dstProvider) => {
        const poolContract = this.context.contractConnector.connect<CommitmentPool>(
          'CommitmentPool',
          config.peerContract?.poolAddress || config.poolAddress,
          dstProvider,
        );
        return { poolContract };
      })
      .then(({ poolContract }) => poolContract.getMinRollupFee())
      .then((minRollupFee) => ({ minRollupFee: toBN(minRollupFee.toString()) }))
      .catch((error) => {
        this.logger.warn(
          `failed to fetch remote config for contract chainId=${options.srcChainId}, address=${
            config.address
          }: ${errorMessage(error)}`,
        );
        return { minRollupFee: config.minRollupFee };
      });
  }

  private static validateNumbers(options: DepositOptions): Promise<DepositOptions> {
    if (options.amount <= 0) {
      return createErrorPromise(
        'amount cannot be negative or zero',
        MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
      );
    }
    if (options.rollupFee <= 0) {
      return createErrorPromise(
        'rollup fee cannot be negative or zero',
        MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
      );
    }
    if (options.bridgeFee && options.bridgeFee < 0) {
      return createErrorPromise('bridge fee cannot be negative', MystikoErrorCode.INVALID_DEPOSIT_OPTIONS);
    }
    if (options.executorFee && options.executorFee < 0) {
      return createErrorPromise('executor fee cannot be negative', MystikoErrorCode.INVALID_DEPOSIT_OPTIONS);
    }
    return Promise.resolve(options);
  }

  private isAddressScreeningRequired(contractConfig: DepositContractConfig): boolean {
    return contractConfig.version > 6;
  }
}
