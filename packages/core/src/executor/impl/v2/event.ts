import { BridgeType, ChainConfig, DepositContractConfig, PoolContractConfig } from '@mystikonetwork/config';
import {
  Commitment,
  CommitmentStatus,
  CommitmentType,
  DepositStatus,
  DepositType,
  Nullifier,
  NullifierType,
} from '@mystikonetwork/database';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import { MystikoHandler } from '../../../handler';
import {
  CommitmentIncludedEvent,
  CommitmentQueuedEvent,
  CommitmentSpentEvent,
  ContractEvent,
  EventExecutor,
  EventImportOptions,
  EventType,
} from '../../../interface';
import { MystikoExecutor } from '../../executor';

type ImportContext = {
  chainConfig: ChainConfig;
  contractConfigs: Map<string, PoolContractConfig | DepositContractConfig>;
  options: EventImportOptions;
};

export class EventExecutorV2 extends MystikoExecutor implements EventExecutor {
  public async import(
    events: ContractEvent | ContractEvent[],
    options: EventImportOptions,
  ): Promise<Commitment[]> {
    let eventsArray: ContractEvent[];
    if (!(events instanceof Array)) {
      eventsArray = [events];
    } else {
      eventsArray = events;
    }
    if (!options.skipCheckPassword) {
      await this.context.wallets.checkPassword(options.walletPassword);
    }
    return this.importEvents(eventsArray, options);
  }

  private buildContext(events: ContractEvent[], options: EventImportOptions): Promise<ImportContext> {
    const { chainId } = options;
    const chainConfig = this.config.getChainConfig(chainId);
    if (!chainConfig) {
      return createErrorPromise(`no chain id=${chainId} configured`, MystikoErrorCode.NON_EXISTING_CHAIN);
    }
    const contractConfigs = new Map<string, DepositContractConfig | PoolContractConfig>();
    events.forEach((event) => {
      const { contractAddress } = event;
      let contractConfig: PoolContractConfig | DepositContractConfig | undefined =
        this.config.getPoolContractConfigByAddress(chainId, contractAddress);
      if (!contractConfig) {
        contractConfig = this.config.getDepositContractConfigByAddress(chainId, contractAddress);
      }
      if (contractConfig) {
        contractConfigs.set(contractConfig.address, contractConfig);
      }
    });

    return Promise.resolve({ chainConfig, contractConfigs, options });
  }

  private async importEvents(events: ContractEvent[], options: EventImportOptions): Promise<Commitment[]> {
    const context = await this.buildContext(events, options);
    const commitmentQueuedEvents: CommitmentQueuedEvent[] = [];
    const commitmentIncludedEvents: CommitmentIncludedEvent[] = [];
    const commitmentSpentEvents: CommitmentSpentEvent[] = [];
    events.forEach((event) => {
      if (event.eventType === EventType.COMMITMENT_QUEUED) {
        commitmentQueuedEvents.push(event);
      } else if (event.eventType === EventType.COMMITMENT_INCLUDED) {
        commitmentIncludedEvents.push(event);
      } else if (event.eventType === EventType.COMMITMENT_SPENT) {
        commitmentSpentEvents.push(event);
      }
    });
    const queuedCommitments = await this.importCommitmentQueuedEvents(commitmentQueuedEvents, context);
    const includedCommitments = await this.importCommitmentIncludedEvent(commitmentIncludedEvents, context);
    const spentCommitments = await this.importCommitmentSpentEvent(commitmentSpentEvents, context);
    const commitments: Map<string, Commitment> = new Map<string, Commitment>();
    queuedCommitments.forEach((commitment) => commitments.set(commitment.commitmentHash, commitment));
    includedCommitments.forEach((commitment) => commitments.set(commitment.commitmentHash, commitment));
    spentCommitments.forEach((commitment) => commitments.set(commitment.commitmentHash, commitment));
    return Array.from(commitments.values());
  }

  private async importCommitmentQueuedEvents(
    events: CommitmentQueuedEvent[],
    context: ImportContext,
  ): Promise<Commitment[]> {
    const startTime = Date.now();
    const { chainConfig } = context;
    const commitments = this.buildCommitments(events, context);
    const findStartTime = Date.now();
    const existingCommitments = await this.context.commitments.find({
      selector: {
        chainId: chainConfig.chainId,
        commitmentHash: { $in: commitments.map((commitment) => commitment.commitmentHash) },
      },
    });
    this.logger.debug(
      `find commitments in importCommitmentQueuedEvents took ${Date.now() - findStartTime}ms`,
    );
    const commitmentsMap = this.buildCommitmentsMap(existingCommitments);
    const mergedCommitments: CommitmentType[] = [];
    commitments.forEach((commitment) => {
      const existing = commitmentsMap.get(
        this.commitmentKey(commitment.chainId, commitment.contractAddress, commitment.commitmentHash),
      );
      if (existing) {
        const merged: CommitmentType = existing.toMutableJSON();
        if (
          merged.status === CommitmentStatus.INIT ||
          merged.status === CommitmentStatus.SRC_PENDING ||
          merged.status === CommitmentStatus.SRC_SUCCEEDED ||
          merged.status === CommitmentStatus.FAILED
        ) {
          merged.status = CommitmentStatus.QUEUED;
        }
        merged.leafIndex = commitment.leafIndex;
        merged.rollupFeeAmount = commitment.rollupFeeAmount;
        merged.encryptedNote = commitment.encryptedNote;
        merged.updatedAt = commitment.updatedAt;
        merged.creationTransactionHash = commitment.creationTransactionHash;
        mergedCommitments.push(merged);
      } else {
        mergedCommitments.push(commitment);
      }
    });
    const updatedDbCommitments = await this.context.db.commitments.bulkUpsert(mergedCommitments);
    const updatedCommitments = await this.updateDepositStatus(
      updatedDbCommitments,
      DepositStatus.QUEUED,
      context,
    );
    this.logger.debug(`imported CommitmentQueued events in ${Date.now() - startTime}ms`);
    return Promise.resolve(updatedCommitments);
  }

  private async importCommitmentIncludedEvent(
    events: CommitmentIncludedEvent[],
    context: ImportContext,
  ): Promise<Commitment[]> {
    const startTime = Date.now();
    const { chainConfig, contractConfigs } = context;
    const commitments = this.buildCommitments(events, context);
    const findStartTime = Date.now();
    const existingCommitments = await this.context.commitments.find({
      selector: {
        chainId: chainConfig.chainId,
        commitmentHash: { $in: commitments.map((commitment) => commitment.commitmentHash) },
      },
    });
    this.logger.debug(
      `find commitments in importCommitmentIncludedEvent took ${Date.now() - findStartTime}ms`,
    );
    const commitmentsMap = this.buildCommitmentsMap(existingCommitments);
    const commitmentsToUpdate: CommitmentType[] = [];
    const commitmentsBuildTime = Date.now();
    for (let i = 0; i < commitments.length; i += 1) {
      const commitment = commitments[i];
      const {
        commitmentHash,
        contractAddress,
        creationTransactionHash,
        rollupTransactionHash,
        leafIndex,
        rollupFeeAmount,
        encryptedNote,
      } = commitment;
      if (contractConfigs.has(contractAddress)) {
        const existingCommitment = commitmentsMap.get(
          this.commitmentKey(chainConfig.chainId, contractAddress, commitmentHash),
        );
        if (existingCommitment === undefined) {
          if (leafIndex === undefined && rollupFeeAmount === undefined && encryptedNote === undefined) {
            return createErrorPromise(
              `cannot find commitment=${commitmentHash} contract=${contractAddress} chainId=${chainConfig.chainId}`,
              MystikoErrorCode.MISSING_COMMITMENT_DATA,
            );
          }
          commitmentsToUpdate.push(commitment);
        } else {
          const mutableExistingCommitment: CommitmentType = existingCommitment.toMutableJSON();
          if (
            mutableExistingCommitment.status === CommitmentStatus.INIT ||
            mutableExistingCommitment.status === CommitmentStatus.QUEUED ||
            mutableExistingCommitment.status === CommitmentStatus.SRC_PENDING ||
            mutableExistingCommitment.status === CommitmentStatus.SRC_SUCCEEDED ||
            mutableExistingCommitment.status === CommitmentStatus.FAILED
          ) {
            mutableExistingCommitment.status = CommitmentStatus.INCLUDED;
          }
          mutableExistingCommitment.updatedAt = MystikoHandler.now();
          mutableExistingCommitment.creationTransactionHash =
            creationTransactionHash || mutableExistingCommitment.creationTransactionHash;
          mutableExistingCommitment.rollupTransactionHash = rollupTransactionHash;
          mutableExistingCommitment.leafIndex = leafIndex || mutableExistingCommitment.leafIndex;
          mutableExistingCommitment.rollupFeeAmount =
            rollupFeeAmount || mutableExistingCommitment.rollupFeeAmount;
          mutableExistingCommitment.encryptedNote = encryptedNote || mutableExistingCommitment.encryptedNote;
          commitmentsToUpdate.push(mutableExistingCommitment);
        }
      }
    }
    this.logger.debug(
      `commitments build in importCommitmentIncludedEvent took ${Date.now() - commitmentsBuildTime}ms`,
    );
    const updatedDbCommitments = await this.context.db.commitments.bulkUpsert(commitmentsToUpdate);
    const updatedCommitments = await this.updateDepositStatus(
      updatedDbCommitments,
      DepositStatus.INCLUDED,
      context,
    );
    this.logger.debug(`imported CommitmentIncluded events in ${Date.now() - startTime}ms`);
    return Promise.resolve(updatedCommitments);
  }

  private async importCommitmentSpentEvent(
    events: CommitmentSpentEvent[],
    context: ImportContext,
  ): Promise<Commitment[]> {
    const startTime = Date.now();
    const { chainConfig, contractConfigs } = context;
    const nullifiers: NullifierType[] = [];
    events.forEach((event) => {
      if (contractConfigs.has(event.contractAddress)) {
        const { serialNumber, transactionHash } = event;
        const serialNumberStr = typeof serialNumber === 'string' ? serialNumber : serialNumber.toString();
        const now = MystikoHandler.now();
        nullifiers.push({
          id: MystikoHandler.generateId(),
          createdAt: now,
          updatedAt: now,
          chainId: chainConfig.chainId,
          contractAddress: event.contractAddress,
          serialNumber: serialNumberStr,
          transactionHash,
        });
      }
    });
    const existingNullifiers = await this.context.nullifiers.find({
      selector: {
        chainId: chainConfig.chainId,
        serialNumber: { $in: nullifiers.map((n) => n.serialNumber) },
      },
    });
    const nullifiersMap = this.buildNullifiersMap(existingNullifiers);
    const mergedNullifiers: NullifierType[] = [];
    nullifiers.forEach((nullifier) => {
      const existingNullifier = nullifiersMap.get(
        this.nullifierKey(chainConfig.chainId, nullifier.contractAddress, nullifier.serialNumber),
      );
      if (existingNullifier) {
        const merged: NullifierType = existingNullifier.toMutableJSON();
        merged.transactionHash = nullifier.transactionHash;
        merged.updatedAt = MystikoHandler.now();
        mergedNullifiers.push(merged);
      } else {
        mergedNullifiers.push(nullifier);
      }
    });
    const updatedDbNullifiers = await this.context.db.nullifiers.bulkUpsert(mergedNullifiers);
    const commitments = await this.context.commitments.find({
      selector: {
        chainId: chainConfig.chainId,
        serialNumber: { $in: updatedDbNullifiers.map((n) => n.serialNumber) },
      },
    });
    const commitmentsData: CommitmentType[] = [];
    const updatedNullifiersMap = this.buildNullifiersMap(updatedDbNullifiers);
    commitments.forEach((c) => {
      const { serialNumber } = c;
      if (serialNumber !== undefined) {
        const nullifier = updatedNullifiersMap.get(
          this.nullifierKey(c.chainId, c.contractAddress, serialNumber),
        );
        if (nullifier) {
          const data = c.toMutableJSON();
          if (data.status !== CommitmentStatus.FAILED) {
            data.status = CommitmentStatus.SPENT;
          }
          data.spendingTransactionHash = nullifier.transactionHash;
          data.updatedAt = MystikoHandler.now();
          commitmentsData.push(data);
        }
      }
    });
    const updatedCommitments = await this.context.db.commitments.bulkUpsert(commitmentsData);
    this.logger.debug(`imported CommitmentSpent events in ${Date.now() - startTime}ms`);
    return Promise.resolve(updatedCommitments);
  }

  private async updateDepositStatus(
    commitments: Commitment[],
    depositStatus: DepositStatus,
    context: ImportContext,
  ): Promise<Commitment[]> {
    const startTime = Date.now();
    const { chainConfig } = context;
    const deposits = await this.context.deposits.find({
      selector: {
        dstChainId: chainConfig.chainId,
        dstPoolAddress: { $in: commitments.map((commitment) => commitment.contractAddress) },
        commitmentHash: { $in: commitments.map((commitment) => commitment.commitmentHash) },
      },
    });
    const depositsData: DepositType[] = [];
    deposits.forEach((deposit) => {
      const commitment = commitments.find(
        (c) => c.commitmentHash === deposit.commitmentHash && c.contractAddress === deposit.dstPoolAddress,
      );
      if (commitment) {
        const depositData: DepositType = deposit.toMutableJSON();
        depositData.status = depositStatus;
        depositData.updatedAt = MystikoHandler.now();
        if (depositStatus === DepositStatus.QUEUED) {
          if (chainConfig.getPoolContractBridgeType(commitment.contractAddress) === BridgeType.LOOP) {
            depositData.transactionHash = commitment.creationTransactionHash;
          } else {
            depositData.relayTransactionHash = commitment.creationTransactionHash;
          }
        } else if (depositStatus === DepositStatus.INCLUDED) {
          if (commitment.creationTransactionHash) {
            if (chainConfig.getPoolContractBridgeType(commitment.contractAddress) === BridgeType.LOOP) {
              depositData.transactionHash = commitment.creationTransactionHash;
            } else {
              depositData.relayTransactionHash = commitment.creationTransactionHash;
            }
          }
          depositData.rollupTransactionHash = commitment.rollupTransactionHash;
        }
        depositsData.push(depositData);
      }
    });
    await this.context.db.deposits.bulkUpsert(depositsData);
    this.logger.debug(`updated deposits status in ${Date.now() - startTime}ms`);
    return Promise.resolve(commitments);
  }

  private buildCommitments(
    events: CommitmentQueuedEvent[] | CommitmentIncludedEvent[],
    context: ImportContext,
  ): CommitmentType[] {
    const { chainConfig, contractConfigs } = context;
    const commitments: CommitmentType[] = [];
    events.forEach((event) => {
      const contractConfig = contractConfigs.get(event.contractAddress);
      const { commitmentHash, leafIndex, rollupFee, encryptedNote, transactionHash } = event;
      const commitmentHashStr =
        typeof commitmentHash === 'string' ? commitmentHash : commitmentHash.toString();
      const leafIndexStr = typeof leafIndex === 'string' ? leafIndex : leafIndex?.toString();
      const rollupFeeStr = typeof rollupFee === 'string' ? rollupFee : rollupFee?.toString();
      if (contractConfig) {
        const now = MystikoHandler.now();
        const commitment: CommitmentType = {
          id: MystikoHandler.generateId(),
          createdAt: now,
          updatedAt: now,
          chainId: chainConfig.chainId,
          contractAddress: contractConfig.address,
          assetSymbol: contractConfig.assetSymbol,
          assetDecimals: contractConfig.assetDecimals,
          assetAddress: contractConfig.assetAddress,
          commitmentHash: commitmentHashStr,
          leafIndex: leafIndexStr,
          rollupFeeAmount: rollupFeeStr,
          encryptedNote,
          status:
            event.eventType === EventType.COMMITMENT_QUEUED
              ? CommitmentStatus.QUEUED
              : CommitmentStatus.INCLUDED,
        };
        if (event.eventType === EventType.COMMITMENT_QUEUED) {
          commitment.creationTransactionHash = transactionHash;
        } else {
          commitment.creationTransactionHash = event.queuedTransactionHash;
          commitment.rollupTransactionHash = transactionHash;
        }
        commitments.push(commitment);
      }
    });
    return commitments;
  }

  private commitmentKey(chainId: number, contractAddress: string, commitmentHash: string): string {
    return `${chainId}-${contractAddress}-${commitmentHash}`;
  }

  private buildCommitmentsMap(commitments: Commitment[]): Map<string, Commitment> {
    const commitmentsMap = new Map<string, Commitment>();
    commitments.forEach((commitment) =>
      commitmentsMap.set(
        this.commitmentKey(commitment.chainId, commitment.contractAddress, commitment.commitmentHash),
        commitment,
      ),
    );
    return commitmentsMap;
  }

  private nullifierKey(chainId: number, contractAddress: string, serialNumber: string): string {
    return `${chainId}-${contractAddress}-${serialNumber}`;
  }

  private buildNullifiersMap(nullifiers: Nullifier[]): Map<string, Nullifier> {
    const nullifiersMap: Map<string, Nullifier> = new Map<string, Nullifier>();
    nullifiers.forEach((nullifier) => {
      nullifiersMap.set(
        `${nullifier.chainId}-${nullifier.contractAddress}-${nullifier.serialNumber}`,
        nullifier,
      );
    });
    return nullifiersMap;
  }
}
