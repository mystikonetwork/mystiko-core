import { ContractInterface, ethers } from 'ethers';
import { Logger } from 'loglevel';
import { errorMessage, logger as rootLogger } from '@mystiko/utils';
import { BaseSync, SyncResult } from './base';
import { TopicSync, TopicSyncStatus } from './topic/base';
import { Contract } from '../model';
import { ContractHandler, DepositHandler, EventHandler, NoteHandler, WithdrawHandler } from '../handler';
import { DepositTopicSync, MerkleTreeInsertTopicSync, WithdrawTopicSync } from './topic';

export interface ContractSyncStatus {
  contract: Contract;
  isSyncing: boolean;
  syncedBlock: number;
  error?: any;
  topicStatus: { [key: string]: TopicSyncStatus };
}

export class ContractSync implements BaseSync {
  public readonly contract: Contract;

  private readonly topicSyncs: TopicSync[];

  private readonly logger: Logger;

  private error?: any;

  private statusUpdateCallbacks: Array<(status: ContractSyncStatus) => void>;

  constructor(
    contract: Contract,
    eventHandler: EventHandler,
    contractHandler: ContractHandler,
    depositHandler: DepositHandler,
    withdrawHandler: WithdrawHandler,
    noteHandler: NoteHandler,
    syncSize: number,
    contractGenerator?: (
      address: string,
      abi: ContractInterface,
      providerOrSigner: ethers.providers.Provider | ethers.Signer,
    ) => ethers.Contract,
  ) {
    this.contract = contract;
    this.statusUpdateCallbacks = [];
    this.logger = rootLogger.getLogger('ContractSync');
    this.topicSyncs = [
      new DepositTopicSync(
        contract,
        eventHandler,
        contractHandler,
        depositHandler,
        syncSize,
        contractGenerator,
      ),
      new MerkleTreeInsertTopicSync(
        contract,
        eventHandler,
        contractHandler,
        depositHandler,
        noteHandler,
        syncSize,
        contractGenerator,
      ),
      new WithdrawTopicSync(
        contract,
        eventHandler,
        contractHandler,
        withdrawHandler,
        noteHandler,
        syncSize,
        contractGenerator,
      ),
    ];
    this.topicSyncs.forEach((topicSync) => {
      topicSync.onStatusUpdate(() => this.runCallbacks());
    });
  }

  public execute(provider: ethers.providers.Provider, targetBlockNumber: number): Promise<SyncResult> {
    if (!this.isSyncing) {
      return this.executeTopic(provider, targetBlockNumber, 0)
        .then((result) => {
          this.error = result.error;
          return result;
        })
        .catch((error) => {
          this.logger.warn(`${this.logPrefix} failed to sync: ${errorMessage(error)}`);
          this.error = error;
          this.runCallbacks();
          return { syncedBlock: this.syncedBlock, error };
        });
    }
    return Promise.resolve({ syncedBlock: this.syncedBlock });
  }

  public get status(): ContractSyncStatus {
    const topics: { [key: string]: TopicSyncStatus } = {};
    this.topicSyncs.forEach((topicSync) => {
      topics[topicSync.topic] = topicSync.status;
    });
    return {
      contract: this.contract,
      isSyncing: this.isSyncing,
      syncedBlock: this.syncedBlock,
      error: this.error,
      topicStatus: topics,
    };
  }

  public onStatusUpdate(callback: (status: ContractSyncStatus) => void) {
    this.statusUpdateCallbacks.push(callback);
  }

  public removeStatusUpdateCallback(callback: (status: ContractSyncStatus) => void) {
    this.statusUpdateCallbacks = this.statusUpdateCallbacks.filter((cb) => cb !== callback);
  }

  public get syncedBlock(): number {
    const topicBlocks = this.topicSyncs.map((topicSync: TopicSync) => topicSync.syncedBlock);
    return Math.min(...topicBlocks);
  }

  public get isSyncing(): boolean {
    for (let index = 0; index < this.topicSyncs.length; index += 1) {
      if (this.topicSyncs[index].isSyncing) {
        return true;
      }
    }
    return false;
  }

  private get logPrefix(): string {
    return `[chainId=${this.contract.chainId}][address=${this.contract.address}]`;
  }

  private executeTopic(
    provider: ethers.providers.Provider,
    targetBlockNumber: number,
    index: number,
  ): Promise<SyncResult> {
    if (index < this.topicSyncs.length) {
      return this.topicSyncs[index].execute(provider, targetBlockNumber).then((topicResult: SyncResult) =>
        this.executeTopic(provider, targetBlockNumber, index + 1).then((contractResult: SyncResult) => ({
          syncedBlock: contractResult.syncedBlock,
          error: contractResult.error || topicResult.error,
        })),
      );
    }
    return Promise.resolve({ syncedBlock: this.syncedBlock });
  }

  private runCallbacks() {
    this.statusUpdateCallbacks.forEach((callback) => {
      try {
        callback(this.status);
      } catch (error) {
        this.logger.warn(`${this.logPrefix} status update callback failed: ${errorMessage(error)}`);
      }
    });
  }
}
