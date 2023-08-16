import { BridgeType, ChainConfig, DepositContractConfig, PoolContractConfig } from '@mystikonetwork/config';
import {
  Commitment,
  CommitmentStatus,
  CommitmentType,
  DepositStatus,
  DepositType,
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
  public import(events: ContractEvent | ContractEvent[], options: EventImportOptions): Promise<Commitment[]> {
    let eventsArray: ContractEvent[] = [];
    if (!(events instanceof Array)) {
      eventsArray = [events];
    } else {
      eventsArray = events;
    }
    if (options.skipCheckPassword) {
      return this.importEvents(eventsArray, options);
    }
    return this.context.wallets
      .checkPassword(options.walletPassword)
      .then(() => this.importEvents(eventsArray, options));
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

  private importEvents(events: ContractEvent[], options: EventImportOptions): Promise<Commitment[]> {
    return this.buildContext(events, options).then((context) => {
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
      return this.importCommitmentQueuedEvents(commitmentQueuedEvents, context).then((queuedCommitments) =>
        this.importCommitmentIncludedEvent(commitmentIncludedEvents, context).then((includedCommitments) =>
          this.importCommitmentSpentEvent(commitmentSpentEvents, context).then((spentCommitments) => {
            const commitments: Map<string, Commitment> = new Map<string, Commitment>();
            queuedCommitments.forEach((commitment) => commitments.set(commitment.commitmentHash, commitment));
            includedCommitments.forEach((commitment) =>
              commitments.set(commitment.commitmentHash, commitment),
            );
            spentCommitments.forEach((commitment) => commitments.set(commitment.commitmentHash, commitment));
            return Array.from(commitments.values());
          }),
        ),
      );
    });
  }

  private importCommitmentQueuedEvents(
    events: CommitmentQueuedEvent[],
    context: ImportContext,
  ): Promise<Commitment[]> {
    const { chainConfig, contractConfigs } = context;
    const commitments: CommitmentType[] = [];
    events.forEach((event) => {
      const contractConfig = contractConfigs.get(event.contractAddress);
      const { commitmentHash, leafIndex, rollupFee, encryptedNote, transactionHash } = event;
      const commitmentHashStr =
        typeof commitmentHash === 'string' ? commitmentHash : commitmentHash.toString();
      const leafIndexStr = typeof leafIndex === 'string' ? leafIndex : leafIndex.toString();
      const rollupFeeStr = typeof rollupFee === 'string' ? rollupFee : rollupFee.toString();
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
          status: CommitmentStatus.QUEUED,
          creationTransactionHash: transactionHash,
        };
        commitments.push(commitment);
      }
    });
    return this.context.commitments
      .find({
        selector: {
          chainId: chainConfig.chainId,
          commitmentHash: { $in: commitments.map((commitment) => commitment.commitmentHash) },
        },
      })
      .then((existingCommitments) => {
        const mergedCommitments: CommitmentType[] = [];
        commitments.forEach((commitment) => {
          const existing = existingCommitments.find(
            (existingCommitment) =>
              existingCommitment.commitmentHash === commitment.commitmentHash &&
              existingCommitment.contractAddress === commitment.contractAddress,
          );
          if (existing) {
            const merged: CommitmentType = existing.toMutableJSON();
            if (merged.status === CommitmentStatus.INIT || merged.status === CommitmentStatus.SRC_SUCCEEDED) {
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
        return this.context.db.commitments.bulkUpsert(mergedCommitments);
      })
      .then((updatedCommitments) =>
        this.updateDepositStatus(updatedCommitments, DepositStatus.QUEUED, context),
      )
      .then((updatedCommitments) => this.decryptCommitments(updatedCommitments, context));
  }

  private importCommitmentIncludedEvent(
    events: CommitmentIncludedEvent[],
    context: ImportContext,
  ): Promise<Commitment[]> {
    const { chainConfig, contractConfigs } = context;
    return this.context.commitments
      .find({
        selector: {
          chainId: chainConfig.chainId,
          commitmentHash: {
            $in: events.map((e) =>
              typeof e.commitmentHash === 'string' ? e.commitmentHash : e.commitmentHash.toString(),
            ),
          },
        },
      })
      .then((existingCommitments) => {
        const commitments: CommitmentType[] = [];
        for (let i = 0; i < events.length; i += 1) {
          const event = events[i];
          const { commitmentHash, contractAddress, transactionHash } = event;
          if (contractConfigs.has(contractAddress)) {
            const commitmentHashStr =
              typeof commitmentHash === 'string' ? commitmentHash : commitmentHash.toString();
            const existingCommitment = existingCommitments.find(
              (c) => c.commitmentHash === commitmentHashStr && c.contractAddress === contractAddress,
            );
            if (!existingCommitment) {
              return this.context.contracts
                .resetSync({ chainId: chainConfig.chainId, address: contractAddress })
                .then(() =>
                  createErrorPromise(
                    `cannot find commitment=${commitmentHashStr} contract=${contractAddress} chainId=${chainConfig.chainId}`,
                    MystikoErrorCode.MISSING_COMMITMENT_DATA,
                  ),
                );
            }
            const commitment: CommitmentType = existingCommitment.toMutableJSON();
            if (
              commitment.status === CommitmentStatus.INIT ||
              commitment.status === CommitmentStatus.QUEUED ||
              commitment.status === CommitmentStatus.SRC_SUCCEEDED
            ) {
              commitment.status = CommitmentStatus.INCLUDED;
            }
            commitment.updatedAt = MystikoHandler.now();
            commitment.rollupTransactionHash = transactionHash;
            commitments.push(commitment);
          }
        }
        return this.context.db.commitments.bulkUpsert(commitments);
      })
      .then((updatedCommitments) =>
        this.updateDepositStatus(updatedCommitments, DepositStatus.INCLUDED, context),
      );
  }

  private importCommitmentSpentEvent(
    events: CommitmentSpentEvent[],
    context: ImportContext,
  ): Promise<Commitment[]> {
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
    return this.context.nullifiers
      .find({
        selector: {
          chainId: chainConfig.chainId,
          serialNumber: { $in: nullifiers.map((n) => n.serialNumber) },
        },
      })
      .then((existingNullifiers) => {
        const mergedNullifiers: NullifierType[] = [];
        nullifiers.forEach((nullifier) => {
          const existingNullifier = existingNullifiers.find(
            (n) =>
              n.contractAddress === nullifier.contractAddress && n.serialNumber === nullifier.serialNumber,
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
        return this.context.db.nullifiers.bulkUpsert(mergedNullifiers);
      })
      .then((updatedNullifiers) =>
        this.context.commitments
          .find({
            selector: {
              chainId: chainConfig.chainId,
              serialNumber: { $in: updatedNullifiers.map((n) => n.serialNumber) },
            },
          })
          .then((commitments) => ({ updatedNullifiers, commitments })),
      )
      .then(({ updatedNullifiers, commitments }) => {
        const commitmentsData: CommitmentType[] = [];
        commitments.forEach((c) => {
          const nullifier = updatedNullifiers.find(
            (n) => n.contractAddress === c.contractAddress && n.serialNumber === c.serialNumber,
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
        });
        return this.context.db.commitments.bulkUpsert(commitmentsData);
      });
  }

  private updateDepositStatus(
    commitments: Commitment[],
    depositStatus: DepositStatus,
    context: ImportContext,
  ): Promise<Commitment[]> {
    const { chainConfig } = context;
    return this.context.deposits
      .find({
        selector: {
          dstChainId: chainConfig.chainId,
          dstPoolAddress: { $in: commitments.map((commitment) => commitment.contractAddress) },
          commitmentHash: { $in: commitments.map((commitment) => commitment.commitmentHash) },
        },
      })
      .then((deposits) => {
        const depositsData: DepositType[] = [];
        deposits.forEach((deposit) => {
          const commitment = commitments.find(
            (c) =>
              c.commitmentHash === deposit.commitmentHash && c.contractAddress === deposit.dstPoolAddress,
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
              depositData.rollupTransactionHash = commitment.rollupTransactionHash;
            }
            depositsData.push(depositData);
          }
        });
        return this.context.db.deposits.bulkUpsert(depositsData);
      })
      .then(() => commitments);
  }

  private decryptCommitments(commitments: Commitment[], context: ImportContext): Promise<Commitment[]> {
    return this.context.executors.getCommitmentExecutor().decrypt({
      commitments,
      walletPassword: context.options.walletPassword,
    });
  }
}
