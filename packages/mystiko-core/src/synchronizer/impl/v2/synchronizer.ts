import { errorMessage, logger as rootLogger } from '@mystikonetwork/utils';
import { Logger } from 'loglevel';
import {
  MystikoContextInterface,
  SyncChainStatus,
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
  public static readonly DEFAULT_START_DELAY_MS = 10000;

  public static readonly DEFAULT_INTERVAL_MS = 300000;

  private readonly context: MystikoContextInterface;

  private readonly chains: Map<number, ChainInternalStatus>;

  private readonly listeners: EventListener[];

  private readonly logger: Logger;

  private initTimer?: NodeJS.Timer;

  private intervalTimer?: NodeJS.Timer;

  private isSyncing: boolean;

  private schedulerState: SyncSchedulerState;

  private error?: string;

  constructor(context: MystikoContextInterface) {
    this.context = context;
    this.isSyncing = false;
    this.logger = rootLogger.getLogger('SynchronizerV2');
    this.schedulerState = SyncSchedulerState.INIT;
    this.chains = this.initChainInternalStatuses();
    this.listeners = [];
  }

  public cancelSchedule(): void {
    if (this.schedulerState === SyncSchedulerState.SCHEDULED) {
      if (this.initTimer) {
        clearInterval(this.initTimer);
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
    return this.context.wallets
      .checkPassword(options.walletPassword)
      .then(() => this.context.db.waitForLeadership())
      .then(() => {
        if (
          this.schedulerState !== SyncSchedulerState.SCHEDULED &&
          (!this.initTimer || !this.intervalTimer)
        ) {
          const { startDelayMs, intervalMs } = options;
          this.schedulerState = SyncSchedulerState.SCHEDULED;
          this.initTimer = setTimeout(() => {
            this.intervalTimer = setTimeout(
              () => this.executeSync(options),
              intervalMs || SynchronizerV2.DEFAULT_INTERVAL_MS,
            );
          }, startDelayMs || SynchronizerV2.DEFAULT_START_DELAY_MS);
        }
        return Promise.resolve();
      });
  }

  public run(options: SyncOptions): Promise<void> {
    return this.context.wallets.checkPassword(options.walletPassword).then(() => this.executeSync(options));
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
      this.logger.info('start synchronizing relevant data from blockchains');
      return this.updateStatus(true)
        .then(() => {
          const promises: Promise<void>[] = [];
          this.chains.forEach((chainStatus) => {
            const { chainId } = chainStatus;
            if (!chainStatus.isSyncing) {
              chainStatus.isSyncing = true;
              chainStatus.error = undefined;
              promises.push(
                this.callListeners(SyncEventType.CHAIN_SYNCHRONIZING, chainId)
                  .then(() =>
                    this.context.commitments.import({ walletPassword: options.walletPassword, chainId }),
                  )
                  .then(() => this.context.chains.findOne(chainId))
                  .then((updatedChain) => {
                    if (updatedChain) {
                      chainStatus.isSyncing = false;
                    }
                    return this.callListeners(SyncEventType.CHAIN_SYNCHRONIZED, chainId);
                  })
                  .catch((error) => {
                    chainStatus.error = errorMessage(error);
                    chainStatus.isSyncing = false;
                    return this.callListeners(SyncEventType.CHAIN_FAILED, chainId);
                  }),
              );
            }
          });
          return Promise.all(promises);
        })
        .then(() => {
          this.logger.info('synchronization finished successfully');
          return this.updateStatus(false);
        })
        .catch((error) => {
          const syncError = errorMessage(error);
          this.logger.warn(`synchronization failed: ${syncError}`);
          return this.updateStatus(false, syncError);
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

  private updateStatus(isSyncing: boolean, error?: string): Promise<void> {
    this.isSyncing = isSyncing;
    this.error = error;
    if (error) {
      return this.callListeners(SyncEventType.FAILED);
    }
    if (isSyncing) {
      return this.callListeners(SyncEventType.SYNCHRONIZING);
    }
    return this.callListeners(SyncEventType.SYNCHRONIZED);
  }

  private callListeners(eventType: SyncEventType, chainId?: number): Promise<void> {
    return this.status
      .then((status) => {
        this.listeners.forEach((eventListener) => {
          const { listener, eventTypes } = eventListener;
          try {
            if (eventTypes.length === 0 || eventTypes.indexOf(eventType) >= 0) {
              listener({
                type: eventType,
                status,
                chainStatus: chainId ? SynchronizerV2.getChainStatus(status, chainId) : undefined,
              });
            }
          } catch (listenerError) {
            this.logger.warn(`call one of the listener failed: ${errorMessage(listenerError)}`);
          }
        });
      })
      .catch((statusError) => {
        this.logger.warn(`failed to fetch synchronizer status: ${errorMessage(statusError)}`);
      });
  }

  private static getChainStatus(status: SyncStatus, chainId: number): SyncChainStatus | undefined {
    for (let i = 0; i < status.chains.length; i += 1) {
      if (status.chains[i].chainId === chainId) {
        return status.chains[i];
      }
    }
    return undefined;
  }
}
