export interface SyncResult {
  syncedBlock: number;
  error?: any;
}

export interface BaseSync {
  execute(targetBlockNumber: number): Promise<SyncResult>;
  get syncedBlock(): number;
  get isSyncing(): boolean;
}
