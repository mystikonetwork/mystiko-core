import { errorMessage, logger as rootLogger, promiseWithTimeout } from '@mystikonetwork/utils';
import { BroadcastChannel } from 'broadcast-channel';
import { Logger } from 'loglevel';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import {
  MystikoContextInterface,
  SyncChainStatus,
  SyncEvent,
  SyncEventType,
  Synchronizer,
  SyncListener,
  SyncOptions,
  SyncSchedulerOptions,
  SyncSchedulerState,
  SyncStatus,
} from '../../../interface';

type ChainInternalStatus = {
  chainId: number;
  name: string;
  isSyncing: boolean;
  error?: string;
};

type EventListener = {
  listener: SyncListener;
  eventTypes: SyncEventType[];
};

export class SynchronizerV2 implements Synchronizer {
  public static readonly DEFAULT_START_DELAY_MS = 1000;

  public static readonly DEFAULT_INTERVAL_MS = 300000;

  public static readonly DEFAULT_SYNC_TIMEOUT_MS = 120000;

  public static readonly DEFAULT_SYNC_CHAIN_TIMEOUT_MS = 60000;

  private readonly context: MystikoContextInterface;

  private readonly chains: Map<number, ChainInternalStatus>;

  private readonly listeners: EventListener[];

  private readonly logger: Logger;

  private readonly broadcastChannel: BroadcastChannel<SyncEvent>;

  private initTimer?: NodeJS.Timer;

  private intervalTimer?: NodeJS.Timer;

  private isSyncing: boolean;

  private isClosed: boolean;

  private hasPendingSync: boolean;

  private schedulerState: SyncSchedulerState;

  private syncError?: string;

  constructor(context: MystikoContextInterface) {
    this.context = context;
    this.isSyncing = false;
    this.isClosed = false;
    this.hasPendingSync = false;
    this.logger = rootLogger.getLogger('SynchronizerV2');
    this.schedulerState = SyncSchedulerState.INIT;
    this.chains = this.initChainInternalStatuses();
    this.broadcastChannel = this.initBroadcastChannel();
    this.listeners = [];
  }

  public close(): Promise<void> {
    if (!this.isClosed) {
      return this.broadcastChannel.close().then(() => {
        this.cancelSchedule();
        this.isClosed = true;
      });
    }
    return Promise.resolve();
  }

  public cancelSchedule(): void {
    if (this.schedulerState === SyncSchedulerState.SCHEDULED) {
      if (this.initTimer) {
        clearTimeout(this.initTimer);
        this.initTimer = undefined;
      }
      if (this.intervalTimer) {
        clearInterval(this.intervalTimer);
        this.intervalTimer = undefined;
      }
      this.schedulerState = SyncSchedulerState.CANCELED;
    }
  }

  public schedule(options: SyncSchedulerOptions): Promise<void> {
    return this.checkClose()
      .then(() => this.context.wallets.checkPassword(options.walletPassword))
      .then(() => this.context.db.waitForLeadership())
      .then(() => {
        if (
          this.schedulerState !== SyncSchedulerState.SCHEDULED &&
          (!this.initTimer || !this.intervalTimer)
        ) {
          const { startDelayMs, intervalMs } = options;
          this.schedulerState = SyncSchedulerState.SCHEDULED;
          this.initTimer = setTimeout(
            () => {
              this.executeSync(options).then(() => {
                this.intervalTimer = setInterval(
                  () => this.executeSync(options),
                  intervalMs !== undefined ? intervalMs : SynchronizerV2.DEFAULT_INTERVAL_MS,
                );
              });
            },
            startDelayMs !== undefined ? startDelayMs : SynchronizerV2.DEFAULT_START_DELAY_MS,
          );
        }
        return Promise.resolve();
      });
  }

  public run(options: SyncOptions): Promise<void> {
    return this.checkClose()
      .then(() => this.context.wallets.checkPassword(options.walletPassword))
      .then(() => this.executeSync(options));
  }

  public addListener(listener: SyncListener, event?: SyncEventType | SyncEventType[]) {
    let eventTypes: SyncEventType[] = [];
    if (event) {
      eventTypes = event instanceof Array ? event : [event];
    }
    this.listeners.push({ listener, eventTypes });
  }

  public removeListener(listener: SyncListener) {
    const index = this.listeners.findIndex((eventListener) => eventListener.listener === listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }

  public get running(): boolean {
    return this.isSyncing;
  }

  public get closed(): boolean {
    return this.isClosed;
  }

  public get error(): string | undefined {
    if (this.syncError) {
      return this.syncError;
    }
    if (Array.from(this.chains.values()).filter((c) => !!c.error).length > 0) {
      return 'some chain(s) failed to sync';
    }
    return undefined;
  }

  public get scheduled(): boolean {
    return this.schedulerState === SyncSchedulerState.SCHEDULED;
  }

  public get status(): Promise<SyncStatus> {
    const promises: Promise<SyncChainStatus>[] = [];
    this.chains.forEach((chainInternalStatus) => {
      promises.push(
        this.context.chains.findOne(chainInternalStatus.chainId).then((chain) => ({
          chainId: chain?.chainId || chainInternalStatus.chainId,
          name: chain?.name || chainInternalStatus.name,
          syncedBlock: chain?.syncedBlockNumber || 0,
          isSyncing: chainInternalStatus.isSyncing,
          error: chainInternalStatus.error,
        })),
      );
    });
    return Promise.all(promises).then((chainStatuses) => ({
      schedulerState: this.schedulerState,
      chains: chainStatuses,
      isSyncing: this.isSyncing,
      error: this.error,
    }));
  }

  private executeSync(options: SyncOptions): Promise<void> {
    if (!this.isSyncing) {
      this.hasPendingSync = true;
      this.logger.info('start synchronizing relevant data from blockchains');
      return this.updateStatus(options, true)
        .then(() => {
          const promises: Promise<void>[] = [];
          this.chains.forEach((chainStatus) => {
            const { chainId } = chainStatus;
            if (!chainStatus.isSyncing) {
              chainStatus.isSyncing = true;
              chainStatus.error = undefined;
              promises.push(
                this.emitEvent(options, SyncEventType.CHAIN_SYNCHRONIZING, chainId)
                  .then(() =>
                    promiseWithTimeout(
                      this.context.commitments.import({ walletPassword: options.walletPassword, chainId }),
                      options.chainTimeoutMs || SynchronizerV2.DEFAULT_SYNC_CHAIN_TIMEOUT_MS,
                    ),
                  )
                  .then(() => this.context.chains.findOne(chainId))
                  .then((updatedChain) => {
                    if (updatedChain) {
                      chainStatus.isSyncing = false;
                    }
                    return this.emitEvent(options, SyncEventType.CHAIN_SYNCHRONIZED, chainId);
                  })
                  .catch((error) => {
                    chainStatus.error = errorMessage(error);
                    chainStatus.isSyncing = false;
                    return this.emitEvent(options, SyncEventType.CHAIN_FAILED, chainId);
                  }),
              );
            }
          });
          return promiseWithTimeout(
            Promise.all(promises),
            options.timeoutMs || SynchronizerV2.DEFAULT_SYNC_TIMEOUT_MS,
          );
        })
        .then(() => {
          this.hasPendingSync = false;
          this.logger.info('synchronization finished successfully');
          return this.updateStatus(options, false);
        })
        .catch((error) => /* istanbul ignore next */ {
          this.hasPendingSync = false;
          const syncError = errorMessage(error);
          this.logger.warn(`synchronization failed: ${syncError}`);
          return this.updateStatus(options, false, syncError);
        });
    }
    return Promise.resolve();
  }

  private initChainInternalStatuses(): Map<number, ChainInternalStatus> {
    const internalStatuses = new Map<number, ChainInternalStatus>();
    this.context.config.chains.forEach((chainConfig) => {
      internalStatuses.set(chainConfig.chainId, {
        chainId: chainConfig.chainId,
        name: chainConfig.name,
        isSyncing: false,
      });
    });
    return internalStatuses;
  }

  private initBroadcastChannel(): BroadcastChannel<SyncEvent> {
    const channel = new BroadcastChannel<SyncEvent>('mystiko-synchronizer');
    channel.addEventListener('message', (event) => {
      const { status } = event;
      if (!this.hasPendingSync && !this.isClosed) {
        this.copyStatus(status);
        return this.callListeners(event);
      }
      /* istanbul ignore next */
      return Promise.resolve();
    });
    return channel;
  }

  private updateStatus(options: SyncOptions, isSyncing: boolean, error?: string): Promise<void> {
    this.isSyncing = isSyncing;
    this.syncError = error;
    /* istanbul ignore if */
    if (error) {
      return this.emitEvent(options, SyncEventType.FAILED);
    }
    if (isSyncing) {
      return this.emitEvent(options, SyncEventType.SYNCHRONIZING);
    }
    return this.emitEvent(options, SyncEventType.SYNCHRONIZED);
  }

  private emitEvent(options: SyncOptions, eventType: SyncEventType, chainId?: number): Promise<void> {
    if (!this.isClosed) {
      return this.status
        .then((status) => {
          const event: SyncEvent = {
            type: eventType,
            status,
            chainStatus: chainId ? SynchronizerV2.getChainStatus(status, chainId) : undefined,
          };
          return this.broadcastChannel
            .postMessage(event)
            .then(() => event)
            .catch((error) => /* istanbul ignore next */ {
              this.logger.warn(`failed to broadcast message: ${errorMessage(error)}`);
              return event;
            });
        })
        .then((event) => this.callListeners(event))
        .catch((statusError) => /* istanbul ignore next */ {
          this.logger.warn(`failed to fetch synchronizer status: ${errorMessage(statusError)}`);
        });
    }
    return Promise.resolve();
  }

  private callListeners(event: SyncEvent): void {
    this.listeners.forEach((eventListener) => {
      const { listener, eventTypes } = eventListener;
      try {
        if (eventTypes.length === 0 || eventTypes.indexOf(event.type) >= 0) {
          listener(event);
        }
      } catch (listenerError) /* istanbul ignore next */ {
        this.logger.warn(`call one of the listener failed: ${errorMessage(listenerError)}`);
      }
    });
  }

  private checkClose(): Promise<void> {
    return this.isClosed
      ? createErrorPromise('synchronizer has already been closed', MystikoErrorCode.SYNCHRONIZER_CLOSED)
      : Promise.resolve();
  }

  private copyStatus(status: SyncStatus) {
    this.isSyncing = status.isSyncing;
    this.syncError = status.error;
    status.chains.forEach((chainStatus) => {
      this.chains.set(chainStatus.chainId, {
        chainId: chainStatus.chainId,
        name: chainStatus.name,
        isSyncing: chainStatus.isSyncing,
        error: chainStatus.error,
      });
    });
  }

  private static getChainStatus(status: SyncStatus, chainId: number): SyncChainStatus | undefined {
    for (let i = 0; i < status.chains.length; i += 1) {
      if (status.chains[i].chainId === chainId) {
        return status.chains[i];
      }
    }
    /* istanbul ignore next */
    return undefined;
  }
}
