import { BridgeType, ChainConfig, DepositContractConfig, PoolContractConfig } from '@mystikonetwork/config';
import {
  Commitment,
  CommitmentStatus,
  CommitmentType,
  DepositStatus,
  NullifierType,
} from '@mystikonetwork/database';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import { MystikoHandler } from '../../../handler';
import {
  CommitmentIncludedEvent,
  CommitmentQueuedEvent,
  CommitmentSpentEvent,
  ContractEvent,
  DepositUpdate,
  EventExecutor,
  EventImportOptions,
  EventType,
} from '../../../interface';
import { MystikoExecutor } from '../../executor';

type ImportContext = {
  chainConfig: ChainConfig;
  contractConfig: PoolContractConfig | DepositContractConfig;
  options: EventImportOptions;
};

export class EventExecutorV2 extends MystikoExecutor implements EventExecutor {
  public import(event: ContractEvent, options: EventImportOptions): Promise<Commitment[]> {
    if (options.skipCheckPassword) {
      return this.importEvent(event, options);
    }
    return this.context.wallets
      .checkPassword(options.walletPassword)
      .then(() => this.importEvent(event, options));
  }

  public importBatch(events: ContractEvent[], options: EventImportOptions): Promise<Commitment[]> {
    if (options.skipCheckPassword) {
      return this.importEvents(events, options);
    }
    return this.context.wallets
      .checkPassword(options.walletPassword)
      .then(() => this.importEvents(events, options));
  }

  private buildContext(event: ContractEvent, options: EventImportOptions): Promise<ImportContext> {
    const { chainId, contractAddress } = event;
    const chainConfig = this.config.getChainConfig(chainId);
    if (!chainConfig) {
      return createErrorPromise(`no chain id=${chainId} configured`, MystikoErrorCode.NON_EXISTING_CHAIN);
    }
    let contractConfig: PoolContractConfig | DepositContractConfig | undefined =
      this.config.getPoolContractConfigByAddress(chainId, contractAddress);
    if (!contractConfig) {
      contractConfig = this.config.getDepositContractConfigByAddress(chainId, contractAddress);
    }
    if (!contractConfig) {
      return createErrorPromise(
        `no contract chainId=${chainId}, address=${contractAddress} configured`,
        MystikoErrorCode.NON_EXISTING_CONTRACT,
      );
    }
    return Promise.resolve({ chainConfig, contractConfig, options });
  }

  private importEvent(event: ContractEvent, options: EventImportOptions): Promise<Commitment[]> {
    return this.buildContext(event, options).then((context) => {
      if (event.eventType === EventType.COMMITMENT_QUEUED) {
        return this.importCommitmentQueuedEvent(event, context);
      }
      if (event.eventType === EventType.COMMITMENT_INCLUDED) {
        return this.importCommitmentIncludedEvent(event, context);
      }
      return this.importCommitmentSpentEvent(event, context);
    });
  }

  private importEvents(events: ContractEvent[], options: EventImportOptions): Promise<Commitment[]> {
    const promises: Promise<Commitment[]>[] = events.map((event) => this.importEvent(event, options));
    return Promise.all(promises).then((commitments) => commitments.flat());
  }

  private importCommitmentQueuedEvent(
    event: CommitmentQueuedEvent,
    context: ImportContext,
  ): Promise<Commitment[]> {
    const { commitmentHash, leafIndex, rollupFee, encryptedNote, transactionHash } = event;
    const { chainConfig, contractConfig } = context;
    const commitmentHashStr = typeof commitmentHash === 'string' ? commitmentHash : commitmentHash.toString();
    const leafIndexStr = typeof leafIndex === 'string' ? leafIndex : leafIndex.toString();
    const rollupFeeStr = typeof rollupFee === 'string' ? rollupFee : rollupFee.toString();
    return this.context.commitments
      .findOne({
        chainId: chainConfig.chainId,
        contractAddress: contractConfig.address,
        commitmentHash: commitmentHashStr,
      })
      .then((existingCommitment) => {
        const now = MystikoHandler.now();
        if (existingCommitment) {
          return existingCommitment.atomicUpdate((data) => {
            if (data.status === CommitmentStatus.INIT || data.status === CommitmentStatus.SRC_SUCCEEDED) {
              data.status = CommitmentStatus.QUEUED;
            }
            data.leafIndex = leafIndexStr;
            data.rollupFeeAmount = rollupFeeStr;
            data.encryptedNote = encryptedNote;
            data.updatedAt = now;
            data.creationTransactionHash = transactionHash;
            return data;
          });
        }
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
        };
        commitment.creationTransactionHash = transactionHash;
        return this.db.commitments.insert(commitment);
      })
      .then((commitment) => {
        const depositUpdate: DepositUpdate = {
          status: DepositStatus.QUEUED,
        };
        if (chainConfig.getPoolContractBridgeType(contractConfig.address) === BridgeType.LOOP) {
          depositUpdate.transactionHash = transactionHash;
        } else {
          depositUpdate.relayTransactionHash = transactionHash;
        }
        return this.updateDepositStatus(commitment, depositUpdate);
      })
      .then((commitment) => [commitment]);
  }

  private importCommitmentIncludedEvent(
    event: CommitmentIncludedEvent,
    context: ImportContext,
  ): Promise<Commitment[]> {
    const { commitmentHash, transactionHash } = event;
    const { chainConfig, contractConfig, options } = context;
    const commitmentHashStr = typeof commitmentHash === 'string' ? commitmentHash : commitmentHash.toString();
    return this.context.commitments
      .findOne({
        chainId: chainConfig.chainId,
        contractAddress: contractConfig.address,
        commitmentHash: commitmentHashStr,
      })
      .then((existingCommitment) => {
        const now = MystikoHandler.now();
        if (existingCommitment) {
          return existingCommitment.atomicUpdate((data) => {
            if (
              data.status === CommitmentStatus.INIT ||
              data.status === CommitmentStatus.QUEUED ||
              data.status === CommitmentStatus.SRC_SUCCEEDED
            ) {
              data.status = CommitmentStatus.INCLUDED;
            }
            data.updatedAt = now;
            data.rollupTransactionHash = transactionHash;
            return data;
          });
        }
        /* istanbul ignore next */
        return createErrorPromise(
          `CommitmentIncluded event contains a commitment=${commitmentHashStr} which does not exist in database`,
          MystikoErrorCode.CORRUPTED_COMMITMENT_DATA,
        );
      })
      .then((commitment) =>
        this.updateDepositStatus(commitment, {
          status: DepositStatus.INCLUDED,
          rollupTransactionHash: transactionHash,
        }),
      )
      .then((commitment) =>
        this.context.executors
          .getCommitmentExecutor()
          .decrypt({ commitment, walletPassword: options.walletPassword }),
      )
      .then((commitment) => [commitment]);
  }

  private importCommitmentSpentEvent(
    event: CommitmentSpentEvent,
    context: ImportContext,
  ): Promise<Commitment[]> {
    const { serialNumber, transactionHash } = event;
    const { chainConfig, contractConfig } = context;
    const serialNumberStr = typeof serialNumber === 'string' ? serialNumber : serialNumber.toString();
    const now = MystikoHandler.now();
    const nullifier: NullifierType = {
      id: MystikoHandler.generateId(),
      createdAt: now,
      updatedAt: now,
      chainId: chainConfig.chainId,
      contractAddress: contractConfig.address,
      serialNumber: serialNumberStr,
      transactionHash,
    };
    return this.context.nullifiers
      .upsert(nullifier)
      .then(() =>
        this.context.commitments.find({
          selector: {
            chainId: chainConfig.chainId,
            contractAddress: contractConfig.address,
            serialNumber: serialNumberStr,
          },
        }),
      )
      .then((commitments) => {
        const promises: Promise<Commitment>[] = commitments.map((commitment) =>
          commitment.atomicUpdate((data) => {
            if (data.status !== CommitmentStatus.FAILED) {
              data.status = CommitmentStatus.SPENT;
            }
            data.spendingTransactionHash = transactionHash;
            return data;
          }),
        );
        return Promise.all(promises);
      });
  }

  private updateDepositStatus(commitment: Commitment, depositUpdate: DepositUpdate): Promise<Commitment> {
    return this.context.deposits
      .find({
        selector: {
          dstChainId: commitment.chainId,
          dstPoolAddress: commitment.contractAddress,
          commitmentHash: commitment.commitmentHash,
        },
      })
      .then((deposits) =>
        Promise.all(deposits.map((deposit) => this.context.deposits.update(deposit.id, depositUpdate))).then(
          () => commitment,
        ),
      );
  }
}
