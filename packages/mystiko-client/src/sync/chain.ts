import { ethers } from 'ethers';
import { Logger } from 'loglevel';
import { errorMessage, logger as rootLogger } from '@mystiko/utils';
import { SyncResult } from './base';
import { ContractSync, ContractSyncStatus } from './contract';

export interface ChainSyncStatus {
  chainId: number;
  isSyncing: boolean;
  syncedBlock: number;
  error?: any;
  contractStatus: { [key: string]: ContractSyncStatus };
}

export class ChainSync {
  public readonly chainId: number;

  private readonly provider: ethers.providers.JsonRpcProvider;

  private readonly contractSyncs: ContractSync[];

  private readonly logger: Logger;

  private error?: any;

  private statusUpdateCallbacks: Array<(status: ChainSyncStatus) => void>;

  constructor(chainId: number, provider: ethers.providers.JsonRpcProvider, contractSyncs: ContractSync[]) {
    this.chainId = chainId;
    this.provider = provider;
    this.contractSyncs = contractSyncs;
    this.logger = rootLogger.getLogger('ChainSync');
    this.statusUpdateCallbacks = [];
    this.contractSyncs.forEach((contractSync) => {
      contractSync.onStatusUpdate(() => this.runCallbacks());
    });
  }

  public execute(): Promise<SyncResult> {
    if (!this.isSyncing) {
      this.error = undefined;
      return this.provider.getBlockNumber().then((targetBlockNumber) =>
        this.executeContract(targetBlockNumber, 0)
          .then((result: SyncResult) => {
            this.error = result.error;
            return result;
          })
          .catch((error) => {
            this.logger.warn(`${this.logPrefix} failed to sync: ${errorMessage(error)}`);
            this.error = error;
            this.runCallbacks();
            return Promise.resolve({ syncedBlock: this.syncedBlock, error });
          }),
      );
    }
    return Promise.resolve({ syncedBlock: this.syncedBlock });
  }

  public get syncedBlock(): number {
    const contractBlocks = this.contractSyncs.map((contractSync: ContractSync) => contractSync.syncedBlock);
    return Math.min(...contractBlocks);
  }

  public get isSyncing(): boolean {
    for (let index = 0; index < this.contractSyncs.length; index += 1) {
      if (this.contractSyncs[index].isSyncing) {
        return true;
      }
    }
    return false;
  }

  public get status(): ChainSyncStatus {
    const contracts: { [key: string]: ContractSyncStatus } = {};
    this.contractSyncs.forEach((contractSync) => {
      if (contractSync.contract.address) {
        contracts[contractSync.contract.address] = contractSync.status;
      }
    });
    return {
      chainId: this.chainId,
      isSyncing: this.isSyncing,
      syncedBlock: this.syncedBlock,
      error: this.error,
      contractStatus: contracts,
    };
  }

  public onStatusUpdate(callback: (status: ChainSyncStatus) => void) {
    this.statusUpdateCallbacks.push(callback);
  }

  public removeStatusUpdateCallback(callback: (status: ChainSyncStatus) => void) {
    this.statusUpdateCallbacks = this.statusUpdateCallbacks.filter((cb) => cb !== callback);
  }

  private executeContract(targetBlockNumber: number, index: number): Promise<SyncResult> {
    if (index < this.contractSyncs.length) {
      return this.contractSyncs[index].execute(targetBlockNumber).then((contractResult: SyncResult) =>
        this.executeContract(targetBlockNumber, index + 1).then((chainResult: SyncResult) => ({
          syncedBlock: chainResult.syncedBlock,
          error: chainResult.error || contractResult.error,
        })),
      );
    }
    return Promise.resolve({ syncedBlock: this.syncedBlock });
  }

  private get logPrefix(): string {
    return `[chainId=${this.chainId}]`;
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
