import { ethers } from 'ethers';
import { Logger } from 'loglevel';
import { errorMessage, logger as rootLogger } from '@mystiko/utils';
import { BaseSync, SyncResult } from '../base';
import { Contract, RawEvent } from '../../model';
import { ContractHandler, EventHandler } from '../../handler';

export interface TopicSyncStatus {
  contract: Contract;
  topic: string;
  isSyncing: boolean;
  syncedBlock: number;
  error?: any;
}

export abstract class TopicSync implements BaseSync {
  public readonly topic: string;

  protected readonly contract: Contract;

  protected readonly etherContract: ethers.Contract;

  protected readonly eventHandler: EventHandler;

  protected readonly contractHandler: ContractHandler;

  protected readonly syncSize: number;

  protected readonly logger: Logger;

  protected syncing: boolean;

  protected error?: any;

  protected statusUpdateCallbacks: Array<(status: TopicSyncStatus) => void>;

  protected constructor(
    contract: Contract,
    etherContract: ethers.Contract,
    topic: string,
    eventHandler: EventHandler,
    contractHandler: ContractHandler,
    syncSize: number,
  ) {
    this.contract = contract;
    this.etherContract = etherContract;
    this.topic = topic;
    this.eventHandler = eventHandler;
    this.contractHandler = contractHandler;
    this.syncSize = syncSize;
    this.logger = rootLogger.getLogger('TopicSync');
    this.syncing = false;
    this.statusUpdateCallbacks = [];
  }

  public execute(targetBlockNumber: number): Promise<SyncResult> {
    if (!this.syncing) {
      this.error = undefined;
      this.updateStatus(true);
      return this.executeChain(targetBlockNumber)
        .then((result) => {
          this.updateStatus(false);
          return { syncedBlock: result };
        })
        .catch((error) => {
          this.error = error;
          this.updateStatus(false);
          this.logger.warn(`${this.logPrefix} failed to sync: ${errorMessage(error)}`);
          return { syncedBlock: this.syncedBlock, error };
        });
    }
    return Promise.resolve({ syncedBlock: this.syncedBlock });
  }

  public get syncedBlock(): number {
    return this.contract.getSyncedTopicBlock(this.topic);
  }

  public get status(): TopicSyncStatus {
    return {
      contract: this.contract,
      topic: this.topic,
      isSyncing: this.isSyncing,
      syncedBlock: this.syncedBlock,
      error: this.error,
    };
  }

  public onStatusUpdate(callback: (status: TopicSyncStatus) => void) {
    this.statusUpdateCallbacks.push(callback);
  }

  public removeStatusUpdateCallback(callback: (status: TopicSyncStatus) => void) {
    this.statusUpdateCallbacks = this.statusUpdateCallbacks.filter((cb) => cb !== callback);
  }

  protected abstract handleEvents(events: RawEvent[]): Promise<void>;

  protected get logPrefix(): string {
    return `[chainId=${this.contract.chainId}][address=${this.contract.address}][topic=${this.topic}]`;
  }

  public get isSyncing(): boolean {
    return this.syncing;
  }

  private executeChain(targetBlockNumber: number): Promise<number> {
    const fromBlockNumber = this.contract.getSyncedTopicBlock(this.topic) + 1;
    if (fromBlockNumber <= targetBlockNumber) {
      const toBlockNumber =
        fromBlockNumber + this.syncSize - 1 < targetBlockNumber
          ? fromBlockNumber + this.syncSize - 1
          : targetBlockNumber;
      const filter = this.etherContract.filters[this.topic]();
      this.logger.info(`${this.logPrefix} start syncing from ${fromBlockNumber} to ${toBlockNumber}`);
      return this.etherContract
        .queryFilter(filter, fromBlockNumber, toBlockNumber)
        .then((events: ethers.Event[]) => {
          const rawEvents = events.map((event: ethers.Event) => {
            const rawEvent: RawEvent = {
              chainId: this.contract.chainId,
              topic: this.topic,
              contractAddress: this.contract.address,
              argumentData: event.args,
            };
            return rawEvent;
          });
          return this.handleEvents(rawEvents).then(() => this.eventHandler.addEvents(rawEvents));
        })
        .then(() => {
          this.contract.setSyncedTopicBlock(this.topic, toBlockNumber);
          return this.contractHandler.updateContract(this.contract).then(() => toBlockNumber);
        })
        .then(() => {
          this.logger.info(`${this.logPrefix} finished syncing from ${fromBlockNumber} to ${toBlockNumber}`);
          return this.executeChain(targetBlockNumber);
        });
    }
    return Promise.resolve(this.syncedBlock);
  }

  private updateStatus(syncingFlag: boolean) {
    if (this.syncing !== syncingFlag) {
      this.syncing = syncingFlag;
      this.statusUpdateCallbacks.forEach((callback) => {
        try {
          callback(this.status);
        } catch (error) {
          this.logger.warn(`${this.logPrefix} status update callback failed: ${errorMessage(error)}`);
        }
      });
    }
  }
}
