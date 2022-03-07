import { ethers } from 'ethers';

export interface SyncResult {
  syncedBlock: number;
  error?: any;
}

export interface BaseSync {
  execute(provider: ethers.providers.Provider, targetBlockNumber: number): Promise<SyncResult>;
  get syncedBlock(): number;
  get isSyncing(): boolean;
}
