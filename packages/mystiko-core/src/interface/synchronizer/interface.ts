export enum SyncSchedulerState {
  INIT = 0,
  SCHEDULED = 1,
  CANCELED = 2,
}

export enum SyncEventType {
  SYNCHRONIZING = 0,
  SYNCHRONIZED = 1,
  FAILED = 2,
  CHAIN_SYNCHRONIZING = 3,
  CHAIN_SYNCHRONIZED = 4,
  CHAIN_FAILED = 5,
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
  run(options: O): Promise<void>;
  schedule(options: SO): Promise<void>;
  cancelSchedule(): void;
  addListener(listener: L, event?: ET | ET[]): void;
  removeListener(listener: L): void;
  get running(): boolean;
  get error(): string | undefined;
  get scheduled(): boolean;
  get status(): Promise<S>;
}
