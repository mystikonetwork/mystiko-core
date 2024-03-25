import { ChainConfig } from '@mystikonetwork/config';
import { Chain, Commitment, Contract } from '@mystikonetwork/database';
import { data } from '@mystikonetwork/protos';
import * as sequencer from '@mystikonetwork/sequencer-client';
import { promiseWithTimeout, toBN, toHex } from '@mystikonetwork/utils';
import { BigNumber } from 'ethers';
import {
  CommitmentIncludedEvent,
  CommitmentQueuedEvent,
  CommitmentSpentEvent,
  ContractEvent,
  EventType,
  ImportOptions,
  ImportResult,
  SequencerExecutor,
  MystikoContextInterface,
} from '../../../interface';
import { splitSyncTasks, SyncTask } from '../../../utils';
import { MystikoExecutor } from '../../executor';

type ImportContext = {
  chainConfig?: ChainConfig;
  chain?: Chain;
  options: ImportOptions;
  timeoutMs: number;
};

type ImportEventsContext = {
  chainConfig: ChainConfig;
  chain: Chain;
  contracts: Contract[];
  startBlock: number;
  endBlock: number;
  options: ImportOptions;
  timeoutMs: number;
  syncTaskGroupIndex: number;
  syncTaskGroups: SyncTask[][];
};

const DEFAULT_FETCH_TIMEOUT_MS = 120000;

export class SequencerExecutorV2 extends MystikoExecutor implements SequencerExecutor {
  private readonly sequencerClient: sequencer.v1.SequencerClient;

  constructor(context: MystikoContextInterface, sequencerClient: sequencer.v1.SequencerClient) {
    super(context);
    this.sequencerClient = sequencerClient;
  }

  public import(options: ImportOptions): Promise<ImportResult> {
    return this.context.wallets
      .checkPassword(options.walletPassword)
      .then(() => this.buildContext(options))
      .then((context) => this.importChain(context));
  }

  private buildContext(options: ImportOptions): Promise<ImportContext> {
    const chainConfig = this.config.getChainConfig(options.chainId);
    const timeoutMs = options.timeoutMs || DEFAULT_FETCH_TIMEOUT_MS;
    return this.context.chains
      .findOne(options.chainId)
      .then((chain) => ({ chainConfig, chain: chain || undefined, options, timeoutMs }));
  }

  private async importChain(context: ImportContext): Promise<ImportResult> {
    const { chainConfig, chain, options, timeoutMs } = context;
    if (!chainConfig || !chain) {
      return Promise.resolve({ commitments: [], hasUpdates: false });
    }
    const synced = await this.context.chains.syncedBlockNumber(
      chainConfig.chainId,
      options.contractAddresses,
    );
    const syncedBlockNumber = synced.syncedBlockNumber || chainConfig.startBlock;
    const { contracts } = synced;
    const chainLoadedBlock = await promiseWithTimeout(
      this.sequencerClient.chainLoadedBlock(options.chainId),
      timeoutMs,
    );
    const syncTaskGroups = splitSyncTasks(
      contracts,
      chainLoadedBlock.blockNumber,
      chainConfig.sequencerFetchSize,
    );
    if (syncTaskGroups.length === 0) {
      return Promise.resolve({ commitments: [], hasUpdates: false });
    }
    const targetBlock = chainLoadedBlock.blockNumber;
    const hasUpdates = targetBlock > syncedBlockNumber;
    if (!hasUpdates) {
      return Promise.resolve({ commitments: [], hasUpdates });
    }
    const eventsContext: ImportEventsContext = {
      chainConfig,
      chain,
      contracts,
      startBlock: syncedBlockNumber + 1,
      endBlock: targetBlock,
      options,
      timeoutMs,
      syncTaskGroupIndex: 0,
      syncTaskGroups,
    };
    let promise = this.importEvents(eventsContext);
    if (options.timeoutMs) {
      promise = promiseWithTimeout(promise, options.timeoutMs);
    }
    const fetchResult = await promise;
    const commitments = await this.saveEvents(eventsContext, fetchResult.events);
    this.logger.info(
      `import(chainId=${options.chainId}) is done, imported ${commitments.length} commitments`,
    );
    return { commitments, hasUpdates };
  }

  private async importEvents(
    context: ImportEventsContext,
  ): Promise<{ context: ImportEventsContext; events: ContractEvent[] }> {
    const { startBlock, endBlock, options, syncTaskGroupIndex, syncTaskGroups } = context;
    if (syncTaskGroupIndex >= syncTaskGroups.length) {
      return Promise.resolve({ context, events: [] });
    }
    const syncTaskGroup = syncTaskGroups[syncTaskGroupIndex];
    const contractQueries: sequencer.v1.ContractDataQuery[] = syncTaskGroup.map((task) => ({
      contractAddress: task.contractAddress,
      startBlock: task.startBlock,
      endBlock: task.endBlock,
    }));
    const contractsData = await this.sequencerClient.fetchChain(options.chainId, {
      startBlock,
      targetBlock: endBlock,
      isFull: true,
      contracts: contractQueries,
    });
    const queuedEvents: CommitmentQueuedEvent[] = [];
    const includedEvents: CommitmentIncludedEvent[] = [];
    const spentEvents: CommitmentSpentEvent[] = [];
    for (let i = 0; i < contractsData.length; i += 1) {
      const contractData = contractsData[i];
      for (let j = 0; j < contractData.commitments.length; j += 1) {
        const commitment = contractData.commitments[j];
        const commitmentHash = toBN(commitment.commitmentHash, 10, 'le').toString();
        const leafIndex = commitment.leafIndex !== undefined ? commitment.leafIndex.toString() : undefined;
        const encryptedNote =
          commitment.encryptedNote !== undefined ? toHex(commitment.encryptedNote) : undefined;
        const rollupFee =
          commitment.rollupFee !== undefined ? toBN(commitment.rollupFee, 10, 'le').toString() : undefined;
        const queuedTransactionHash =
          commitment.queuedTransactionHash !== undefined
            ? toHex(commitment.queuedTransactionHash)
            : undefined;
        const includedTransactionHash =
          commitment.includedTransactionHash !== undefined
            ? toHex(commitment.includedTransactionHash)
            : undefined;
        if (commitment.status === data.v1.CommitmentStatus.QUEUED) {
          if (!leafIndex || !encryptedNote || !rollupFee || !queuedTransactionHash) {
            return Promise.reject(new Error('Invalid commitment queued data'));
          }
          queuedEvents.push({
            eventType: EventType.COMMITMENT_QUEUED,
            contractAddress: contractData.contractAddress,
            commitmentHash,
            leafIndex,
            encryptedNote,
            rollupFee,
            transactionHash: queuedTransactionHash,
          });
        } else if (commitment.status === data.v1.CommitmentStatus.INCLUDED) {
          if (!includedTransactionHash) {
            return Promise.reject(new Error('Invalid commitment included data'));
          }
          includedEvents.push({
            eventType: EventType.COMMITMENT_INCLUDED,
            contractAddress: contractData.contractAddress,
            commitmentHash,
            queuedTransactionHash,
            transactionHash: includedTransactionHash,
            leafIndex,
            encryptedNote,
            rollupFee,
          });
        }
      }
      contractData.nullifiers.forEach((nullifier) => {
        spentEvents.push({
          eventType: EventType.COMMITMENT_SPENT,
          contractAddress: contractData.contractAddress,
          serialNumber: toBN(nullifier.nullifier, 10, 'le').toString(),
          transactionHash: toHex(nullifier.transactionHash),
        });
      });
    }
    const sortedQueuedEvents = queuedEvents.sort((a, b) => {
      if (a.contractAddress === b.contractAddress) {
        return BigNumber.from(a.leafIndex).sub(BigNumber.from(b.leafIndex)).toNumber();
      }
      // istanbul ignore next
      return a.contractAddress.localeCompare(b.contractAddress);
    });
    const events = [sortedQueuedEvents, includedEvents, spentEvents].flat();
    const moreEvents = await this.importEvents({
      ...context,
      syncTaskGroupIndex: syncTaskGroupIndex + 1,
    });
    return { context: moreEvents.context, events: [...events, ...moreEvents.events] };
  }

  private async saveEvents(context: ImportEventsContext, events: ContractEvent[]): Promise<Commitment[]> {
    const { chainConfig, options } = context;
    const commitments = await this.context.executors.getEventExecutor().import(events, {
      chainId: chainConfig.chainId,
      walletPassword: options.walletPassword,
      skipCheckPassword: true,
    });
    await this.saveContractsBlockNumber(context);
    return commitments;
  }

  private async saveContractsBlockNumber(context: ImportEventsContext): Promise<void> {
    const { endBlock, contracts } = context;
    const promises = contracts.map((contract) =>
      contract.atomicUpdate((contractData) => {
        contractData.syncedBlockNumber = endBlock;
        return contractData;
      }),
    );
    await Promise.all(promises);
  }
}
