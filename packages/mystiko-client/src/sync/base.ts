export enum SyncStatus {
  INIT = 0,
  SYNCING = 1,
  SYNCED = 2,
  FAILED = 3,
}

export default interface BaseSync {
  execute(targetBlockNumber: number): Promise<number>;
  get syncedBlock(): number;
  get isSyncing(): boolean;
}
