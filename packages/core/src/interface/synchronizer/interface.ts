export enum SyncSchedulerState {
  INIT = 0,
  SCHEDULED = 1,
  CANCELED = 2,
}

export enum SyncEventType {
  SYNCHRONIZING = 'synchronizing',
  SYNCHRONIZED = 'synchronized',
  FAILED = 'failed',
  CHAIN_SYNCHRONIZING = 'chain_synchronizing',
  CHAIN_SYNCHRONIZED = 'chain_synchronized',
  CHAIN_FAILED = 'chain_failed',
  ACCOUNTS_SCANNING = 'accounts_scanning',
  ACCOUNTS_SCANNED = 'accounts_scanned',
}

export type SyncChainStatus = {
  chainId: number;
  name: string;
  syncedBlock: number;
  isSyncing: boolean;
  error?: string;
};

export type SyncStatus = {
  isSyncing: boolean;
  schedulerState: SyncSchedulerState;
  chains: SyncChainStatus[];
  error?: string;
};

export type SyncOptions = {
  walletPassword: string;
  timeoutMs?: number;
  chainTimeoutMs?: number;
  noIndexer?: boolean;
  noPacker?: boolean;
  chainIds?: number[];
};

export type SyncSchedulerOptions = SyncOptions & {
  startDelayMs?: number;
  intervalMs?: number;
};

export type SyncEvent = {
  type: SyncEventType;
  status: SyncStatus;
  chainStatus?: SyncChainStatus;
};

export type SyncListener = (event: SyncEvent) => void;

export interface Synchronizer<
  S = SyncStatus,
  O = SyncOptions,
  L = SyncListener,
  ET = SyncEventType,
  SO = SyncSchedulerOptions,
> {
  close(): Promise<void>;
  run(options: O): Promise<void>;
  schedule(options: SO): Promise<void>;
  cancelSchedule(): void;
  addListener(listener: L, event?: ET | ET[]): void;
  removeListener(listener: L): void;
  get running(): boolean;
  get closed(): boolean;
  get error(): string | undefined;
  get scheduled(): boolean;
  get status(): Promise<S>;
}
