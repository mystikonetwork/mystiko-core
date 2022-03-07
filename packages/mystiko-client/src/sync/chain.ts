import { ContractInterface, ethers } from 'ethers';
import { Logger } from 'loglevel';
import { errorMessage, logger as rootLogger } from '@mystiko/utils';
import { BaseSync, SyncResult } from './base';
import { ContractSync, ContractSyncStatus } from './contract';
import { ContractHandler, DepositHandler, EventHandler, NoteHandler, WithdrawHandler } from '../handler';

export interface ChainSyncStatus {
  chainId: number;
  isSyncing: boolean;
  syncedBlock: number;
  errors: Array<any>;
  contractStatus: { [key: string]: ContractSyncStatus };
}

export class ChainSync implements BaseSync {
  public readonly chainId: number;

  private readonly contractSyncs: ContractSync[];

  private readonly logger: Logger;

  private errors: Array<any>;

  private syncing: boolean;

  private statusUpdateCallbacks: Array<(status: ChainSyncStatus) => void>;

  constructor(
    chainId: number,
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
    this.chainId = chainId;
    this.errors = [];
    this.logger = rootLogger.getLogger('ChainSync');
    this.statusUpdateCallbacks = [];
    this.contractSyncs = contractHandler
      .getContracts({ filterFunc: (c) => c.chainId === chainId })
      .map(
        (contract) =>
          new ContractSync(
            contract,
            eventHandler,
            contractHandler,
            depositHandler,
            withdrawHandler,
            noteHandler,
            syncSize,
            contractGenerator,
          ),
      );
    this.syncing = false;
  }

  public execute(provider: ethers.providers.Provider, targetBlockNumber: number): Promise<SyncResult> {
    if (!this.syncing) {
      this.errors = [];
      this.updateSyncing(true);
      return this.executeContract(provider, targetBlockNumber, 0)
        .then((result: SyncResult) => {
          this.errors.push(...result.errors);
          this.updateSyncing(false);
          return result;
        })
        .catch((error) => {
          this.logger.warn(`${this.logPrefix} failed to sync: ${errorMessage(error)}`);
          this.errors.push(error);
          this.updateSyncing(false);
          return Promise.resolve({ syncedBlock: this.syncedBlock, errors: this.errors });
        });
    }
    return Promise.resolve({ syncedBlock: this.syncedBlock, errors: this.errors });
  }

  public get syncedBlock(): number {
    const contractBlocks = this.contractSyncs.map((contractSync: ContractSync) => contractSync.syncedBlock);
    return Math.min(...contractBlocks);
  }

  public get isSyncing(): boolean {
    return this.syncing;
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
      errors: this.errors,
      contractStatus: contracts,
    };
  }

  public onStatusUpdate(callback: (status: ChainSyncStatus) => void) {
    this.statusUpdateCallbacks.push(callback);
  }

  public removeStatusUpdateCallback(callback: (status: ChainSyncStatus) => void) {
    this.statusUpdateCallbacks = this.statusUpdateCallbacks.filter((cb) => cb !== callback);
  }

  private executeContract(
    provider: ethers.providers.Provider,
    targetBlockNumber: number,
    index: number,
  ): Promise<SyncResult> {
    if (index < this.contractSyncs.length) {
      return this.contractSyncs[index]
        .execute(provider, targetBlockNumber)
        .then((contractResult: SyncResult) =>
          this.executeContract(provider, targetBlockNumber, index + 1).then((chainResult: SyncResult) => ({
            syncedBlock: chainResult.syncedBlock,
            errors: [...chainResult.errors, ...contractResult.errors],
          })),
        );
    }
    return Promise.resolve({ syncedBlock: this.syncedBlock, errors: [] });
  }

  private get logPrefix(): string {
    return `[chainId=${this.chainId}]`;
  }

  private updateSyncing(s: boolean) {
    if (this.syncing !== s) {
      this.syncing = s;
      this.runCallbacks();
    }
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
