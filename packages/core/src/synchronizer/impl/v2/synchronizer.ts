import {
  AccountStatus,
  Commitment,
  CommitmentStatus,
  DepositStatus,
  TransactionStatus,
} from '@mystikonetwork/database';
import { errorMessage, logger as rootLogger, promiseWithTimeout } from '@mystikonetwork/utils';
import { BroadcastChannel } from 'broadcast-channel';
import { Logger } from 'loglevel';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import { MystikoHandler } from '../../../handler';
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

  public static readonly DEFAULT_SYNC_TIMEOUT_MS = 800000;

  public static readonly DEFAULT_SYNC_CHAIN_TIMEOUT_MS = 600000;

  public static readonly OUT_DATE_TIME_INTERVAL_MS = 600000;

  private readonly context: MystikoContextInterface;

  private readonly chains: Map<number, ChainInternalStatus>;

  private readonly listeners: EventListener[];

  private readonly logger: Logger;

  private readonly broadcastChannel: BroadcastChannel<SyncEvent>;

  private initTimer?: NodeJS.Timeout;

  private intervalTimer?: NodeJS.Timeout;

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
    return this.isFullMode()
      .then((fullMode) => {
        if (!fullMode) {
          return this.getInteractedContracts();
        }
        return this.getFullModeContracts();
      })
      .then((syncingContracts) => {
        const promises: Promise<SyncChainStatus>[] = [];
        this.chains.forEach((chainInternalStatus) => {
          const chainSyncingContractSet = syncingContracts.get(chainInternalStatus.chainId);
          if (chainSyncingContractSet) {
            const chainSyncingContracts = Array.from(chainSyncingContractSet);
            promises.push(
              this.context.chains.findOne(chainInternalStatus.chainId).then((chain) =>
                this.context.chains
                  .syncedBlockNumber(chainInternalStatus.chainId, chainSyncingContracts)
                  .then(({ syncedBlockNumber }) => ({
                    chainId: chainInternalStatus.chainId,
                    name: chain?.name || chainInternalStatus.name,
                    syncedBlock: syncedBlockNumber || 0,
                    isSyncing: chainInternalStatus.isSyncing,
                    error: chainInternalStatus.error,
                    outdated:
                      new Date().getTime() - (chain?.syncedAt || 0) >
                      SynchronizerV2.OUT_DATE_TIME_INTERVAL_MS,
                  })),
              ),
            );
          }
        });
        return Promise.all(promises).then((chainStatuses) => ({
          schedulerState: this.schedulerState,
          chains: chainStatuses,
          isSyncing: this.isSyncing,
          error: this.error,
        }));
      });
  }

  private async executeSync(options: SyncOptions): Promise<void> {
    const isScanning = await this.isScanning();
    if (!this.isSyncing && !isScanning) {
      const fullMode = await this.isFullMode();
      const syncingContracts = fullMode
        ? await this.getFullModeContracts()
        : await this.getInteractedContracts();
      if (syncingContracts.size === 0) {
        return Promise.resolve();
      }
      this.hasPendingSync = true;
      this.logger.info('start synchronizing relevant data from blockchains');
      return this.updateStatus(options, true)
        .then(() => {
          const promises: Promise<void>[] = [];
          const filteredChains =
            options.chainIds && options.chainIds.length > 0 ? new Set(options.chainIds) : undefined;
          this.chains.forEach((chainStatus) => {
            const { chainId } = chainStatus;
            const chainSyncingContractSet = syncingContracts.get(chainId);
            const chainSyncingContracts = chainSyncingContractSet ? Array.from(chainSyncingContractSet) : [];
            const shouldSync = chainSyncingContracts ? chainSyncingContracts.length > 0 : false;
            if (!chainStatus.isSyncing && (!filteredChains || filteredChains.has(chainId)) && shouldSync) {
              chainStatus.isSyncing = true;
              chainStatus.error = undefined;
              promises.push(
                this.emitEvent(options, SyncEventType.CHAIN_SYNCHRONIZING, chainId)
                  .then(() => this.executeSyncImport(options, chainId, chainSyncingContracts))
                  .then(() => this.context.chains.findOne(chainId))
                  .then(async (updatedChain) => {
                    if (updatedChain) {
                      chainStatus.isSyncing = false;
                      await updatedChain.atomicUpdate((data) => {
                        data.syncedAt = new Date().getTime();
                        data.updatedAt = MystikoHandler.now();
                        return data;
                      });
                    }
                    return this.emitEvent(options, SyncEventType.CHAIN_SYNCHRONIZED, chainId);
                  })
                  .catch((error) => {
                    chainStatus.error = errorMessage(error);
                    chainStatus.isSyncing = false;
                    this.logger.error(
                      `failed to import events for chainId=${chainId}: ${errorMessage(error)}`,
                    );
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
          let chainError = false;
          this.chains.forEach((chainStatus) => {
            if (chainStatus.error) {
              chainError = true;
            }
          });
          if (chainError) {
            this.logger.warn('synchronization finished with errors from chain(s)');
          } else {
            this.logger.info('synchronization finished successfully');
          }
          return this.updateStatus(options, false);
        })
        .catch((error) => /* istanbul ignore next */ {
          this.hasPendingSync = false;
          const syncError = errorMessage(error);
          this.logger.warn(`synchronization failed: ${syncError}`);
          return this.updateStatus(options, false, syncError);
        })
        .finally(() => {
          if (!options.skipAccountScan) {
            this.emitEvent(options, SyncEventType.ACCOUNTS_SCANNING).then(() => {
              this.context.commitments.scanAll({ walletPassword: options.walletPassword }).then(() => {
                this.logger.debug('scanned all commitments for all accounts');
                return this.emitEvent(options, SyncEventType.ACCOUNTS_SCANNED);
              });
            });
          } else {
            this.emitEvent(options, SyncEventType.ACCOUNTS_SCANNED);
          }
          return Promise.resolve();
        });
    }
    return Promise.resolve();
  }

  private executeSyncImport(
    options: SyncOptions,
    chainId: number,
    contractAddresses: string[],
  ): Promise<Commitment[]> {
    const timeoutMs = options.chainTimeoutMs || SynchronizerV2.DEFAULT_SYNC_CHAIN_TIMEOUT_MS;
    const packerExecutor = this.context.executors.getPackerExecutor();
    if (packerExecutor && !options.noPacker) {
      return packerExecutor
        .import({ walletPassword: options.walletPassword, chainId, timeoutMs, contractAddresses })
        .then(({ commitments, syncedBlock }) => {
          this.logger.info(
            `synced events for chainId=${chainId} to blockNumber=${syncedBlock}` +
              ` with ${commitments.length} commitments from packer`,
          );
          return this.executeSequencerSyncImport(options, chainId, contractAddresses).then(
            (moreCommitments) => [...commitments, ...moreCommitments],
          );
        })
        .catch((error) => {
          this.logger.warn(
            `failed to import events for chainId=${chainId} from packer: ${errorMessage(error)}`,
          );
          return this.executeSequencerSyncImport(options, chainId, contractAddresses);
        });
    }
    return this.executeSequencerSyncImport(options, chainId, contractAddresses);
  }

  private executeSequencerSyncImport(
    options: SyncOptions,
    chainId: number,
    contractAddresses: string[],
  ): Promise<Commitment[]> {
    const timeoutMs = options.chainTimeoutMs || SynchronizerV2.DEFAULT_SYNC_CHAIN_TIMEOUT_MS;
    const sequencerExecutor = this.context.executors.getSequencerExecutor();
    let promise: Promise<{
      fallback: boolean;
      reason: string;
      commitments: Commitment[];
    }>;
    if (sequencerExecutor && !options.noSequencer) {
      promise = sequencerExecutor
        .import({ walletPassword: options.walletPassword, chainId, timeoutMs, contractAddresses })
        .then(({ commitments, hasUpdates }) => {
          if (hasUpdates) {
            return { fallback: false, reason: '', commitments };
          }
          return { fallback: true, reason: 'sequencer does not have updates', commitments };
        })
        .catch((error) => {
          this.logger.warn(
            `failed to import events for chainId=${chainId} from sequencer: ${errorMessage(error)}`,
          );
          return {
            fallback: true,
            reason: `sequencer raised error: ${errorMessage(error)}`,
            commitments: [],
          };
        });
    } else {
      promise = Promise.resolve({ fallback: true, reason: 'no sequencer is configured', commitments: [] });
    }
    return promise.then(({ fallback, reason, commitments }) => {
      if (fallback) {
        this.logger.info(
          `fallback to import events from node provider for chainId=${chainId}, reason: ${reason}`,
        );
        return this.context.commitments.import({
          walletPassword: options.walletPassword,
          chainId,
          timeoutMs,
          contractAddresses,
        });
      }
      return Promise.resolve(commitments);
    });
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

  private async getInteractedContracts(): Promise<Map<number, Set<string>>> {
    const deposits = await this.context.deposits.find({
      selector: {
        status: {
          $in: [
            DepositStatus.SRC_PENDING,
            DepositStatus.SRC_SUCCEEDED,
            DepositStatus.QUEUED,
            DepositStatus.INCLUDED,
          ],
        },
      },
    });
    const transactions = await this.context.transactions.find({
      selector: {
        $not: { outputCommitments: { $size: 0 } },
        status: { $in: [TransactionStatus.PENDING, TransactionStatus.SUCCEEDED] },
      },
    });
    const commitmentHashes = deposits.map((d) => d.commitmentHash);
    const commitmentIds = transactions.map((t) => t.outputCommitments || []).flat();
    const spentCommitments = await this.context.commitments.find({
      selector: {
        status: CommitmentStatus.SPENT,
        $or: [
          {
            commitmentHash: { $in: commitmentHashes },
          },
          {
            id: { $in: commitmentIds },
          },
        ],
      },
    });
    const spentCommitmentHashes = new Set<String>(
      spentCommitments.map((c) => `${c.chainId}/${c.contractAddress}/${c.commitmentHash}`),
    );
    const spentCommitmentIds = new Set<String>(spentCommitments.map((c) => c.id));
    const interactedContracts: Map<number, Set<string>> = new Map();
    deposits.forEach((deposit) => {
      if (
        !spentCommitmentHashes.has(
          `${deposit.dstChainId}/${deposit.dstPoolAddress}/${deposit.commitmentHash}`,
        )
      ) {
        if (!interactedContracts.has(deposit.chainId)) {
          interactedContracts.set(deposit.chainId, new Set<string>());
        }
        interactedContracts.get(deposit.chainId)?.add(deposit.contractAddress);
        if (!interactedContracts.has(deposit.dstChainId)) {
          interactedContracts.set(deposit.dstChainId, new Set<string>());
        }
        interactedContracts.get(deposit.dstChainId)?.add(deposit.dstPoolAddress);
      }
    });
    transactions.forEach((transaction) => {
      if (transaction.outputCommitments) {
        const unspentCommitments = transaction.outputCommitments.filter((c) => !spentCommitmentIds.has(c));
        if (unspentCommitments.length > 0) {
          if (!interactedContracts.has(transaction.chainId)) {
            interactedContracts.set(transaction.chainId, new Set<string>());
          }
          interactedContracts.get(transaction.chainId)?.add(transaction.contractAddress);
        }
      }
    });
    return interactedContracts;
  }

  private async getFullModeContracts(): Promise<Map<number, Set<string>>> {
    const fullSynchronizationOptions = await this.context.wallets.getFullSynchronizationOptions();
    const contracts: Map<number, Set<string>> = new Map();
    fullSynchronizationOptions.chains.forEach((chainOptions) => {
      const chainConfig = this.context.config.getChainConfig(chainOptions.chainId);
      if (chainOptions.enabled && chainConfig) {
        const assetSymbols = new Set(
          chainOptions.assets.filter((options) => options.enabled).map((options) => options.assetSymbol),
        );
        if (assetSymbols.size > 0) {
          [...chainConfig.depositContracts, ...chainConfig.poolContracts].forEach((contractConfig) => {
            if (assetSymbols.has(contractConfig.assetSymbol)) {
              if (!contracts.has(chainOptions.chainId)) {
                contracts.set(chainOptions.chainId, new Set<string>());
              }
              contracts.get(chainOptions.chainId)?.add(contractConfig.address);
            }
          });
        }
      }
    });
    return contracts;
  }

  private isFullMode(): Promise<boolean> {
    return this.context.wallets.checkCurrent().then((wallet) => !!wallet.fullSynchronization);
  }

  private isScanning(): Promise<boolean> {
    return this.context.accounts
      .find({ selector: { status: AccountStatus.SCANNING } })
      .then((accounts) => accounts.length > 0);
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
