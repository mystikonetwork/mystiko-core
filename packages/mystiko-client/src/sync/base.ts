import { ethers } from 'ethers';

export interface SyncResult {
  syncedBlock: number;
  errors: Array<any>;
}

export interface BaseSync {
  execute(provider: ethers.providers.Provider, targetBlockNumber: number): Promise<SyncResult>;
  get syncedBlock(): number;
  get isSyncing(): boolean;
}
