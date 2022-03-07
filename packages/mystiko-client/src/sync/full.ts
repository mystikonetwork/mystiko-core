import { Logger } from 'loglevel';
import { errorMessage, logger as rootLogger } from '@mystiko/utils';
import { ChainSync, ChainSyncStatus } from './chain';
import { SyncResult } from './base';

export interface FullSyncStatus {
  isSyncing: boolean;
  chainStatus: { [key: number]: ChainSyncStatus };
}

export class FullSync {
  private readonly chainSyncs: ChainSync[];

  private readonly logger: Logger;

  private statusUpdateCallbacks: Array<(status: FullSyncStatus) => void>;

  constructor(chainSyncs: ChainSync[]) {
    this.chainSyncs = chainSyncs;
    this.logger = rootLogger.getLogger('FullSync');
    this.statusUpdateCallbacks = [];
    this.chainSyncs.forEach((chainSync) => {
      chainSync.onStatusUpdate(() => this.runCallbacks());
    });
  }

  public execute(): Promise<SyncResult[]> {
    const promises: Array<Promise<SyncResult>> = [];
    this.chainSyncs.forEach((chainSync) => {
      const promise = chainSync.execute();
      promises.push(promise);
    });
    return Promise.all(promises);
  }

  public get status(): FullSyncStatus {
    const chains: { [key: number]: ChainSyncStatus } = {};
    this.chainSyncs.forEach((chainSync) => {
      chains[chainSync.chainId] = chainSync.status;
    });
    return { isSyncing: this.isSyncing, chainStatus: chains };
  }

  public onStatusUpdate(callback: (status: FullSyncStatus) => void) {
    this.statusUpdateCallbacks.push(callback);
  }

  public removeStatusUpdateCallback(callback: (status: FullSyncStatus) => void) {
    this.statusUpdateCallbacks = this.statusUpdateCallbacks.filter((cb) => cb !== callback);
  }

  public get isSyncing(): boolean {
    const chainSyncs = Object.values(this.chainSyncs);
    for (let index = 0; index < chainSyncs.length; index += 1) {
      if (chainSyncs[index].isSyncing) {
        return true;
      }
    }
    return false;
  }

  private runCallbacks() {
    this.statusUpdateCallbacks.forEach((callback) => {
      try {
        callback(this.status);
      } catch (error) {
        this.logger.warn(`sync status update callback failed: ${errorMessage(error)}`);
      }
    });
  }
}
