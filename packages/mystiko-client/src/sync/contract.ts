import { ContractInterface, ethers } from 'ethers';
import { Logger } from 'loglevel';
import { errorMessage, logger as rootLogger } from '@mystiko/utils';
import { BaseSync, SyncResult } from './base';
import { TopicSync, TopicSyncStatus } from './topic/base';
import { Contract } from '../model';
import { ContractHandler, DepositHandler, EventHandler, NoteHandler, WithdrawHandler } from '../handler';
import { DepositTopicSync, MerkleTreeInsertTopicSync, WithdrawTopicSync } from './topic';
import tracer from '../tracing';

export interface ContractSyncStatus {
  contract: Contract;
  isSyncing: boolean;
  syncedBlock: number;
  errors: Array<any>;
  topicStatus: { [key: string]: TopicSyncStatus };
}

export class ContractSync implements BaseSync {
  public readonly contract: Contract;

  private readonly topicSyncs: TopicSync[];

  private readonly logger: Logger;

  private errors: Array<any>;

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
    this.errors = [];
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
  }

  public execute(provider: ethers.providers.Provider, targetBlockNumber: number): Promise<SyncResult> {
    if (!this.isSyncing) {
      this.errors = [];
      const promises: Array<Promise<SyncResult>> = [];
      this.topicSyncs.forEach((topicSync) => {
        promises.push(topicSync.execute(provider, targetBlockNumber));
      });
      return Promise.all(promises)
        .then((results: SyncResult[]) => {
          this.errors = results.map((result) => result.errors).flat();
          return { syncedBlock: this.syncedBlock, errors: this.errors };
        })
        .catch((error) => {
          tracer.traceError(error);
          this.logger.warn(`${this.logPrefix} failed to execute sync: ${errorMessage(error)}`);
          return { syncedBlock: this.syncedBlock, errors: [error] };
        });
    }
    return Promise.resolve({ syncedBlock: this.syncedBlock, errors: [] });
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
      errors: this.errors,
      topicStatus: topics,
    };
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
}
