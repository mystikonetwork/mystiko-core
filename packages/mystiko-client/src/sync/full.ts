import { ContractInterface, ethers } from 'ethers';
import { Logger } from 'loglevel';
import { MystikoConfig } from '@mystikonetwork/config';
import { errorMessage, logger as rootLogger } from '@mystikonetwork/utils';
import { ChainSync, ChainSyncStatus } from './chain';
import { SyncResult } from './base';
import { ContractHandler, DepositHandler, EventHandler, NoteHandler, WithdrawHandler } from '../handler';
import { ProviderPool } from '../chain';
import tracer from '../tracing';

export interface FullSyncStatus {
  isSyncing: boolean;
  chainStatus: { [key: number]: ChainSyncStatus };
}

export class FullSync {
  private readonly config: MystikoConfig;

  private readonly providerPool: ProviderPool;

  private readonly chainSyncs: ChainSync[];

  private readonly logger: Logger;

  private statusUpdateCallbacks: Array<(status: FullSyncStatus) => void>;

  private readonly initIntervalMs: number;

  private readonly intervalMs: number;

  private intervalTimer?: NodeJS.Timer;

  private initTimer?: NodeJS.Timer;

  constructor(
    eventHandler: EventHandler,
    contractHandler: ContractHandler,
    depositHandler: DepositHandler,
    withdrawHandler: WithdrawHandler,
    noteHandler: NoteHandler,
    config: MystikoConfig,
    providerPool: ProviderPool,
    initIntervalMs?: number,
    intervalMs?: number,
    contractGenerator?: (
      address: string,
      abi: ContractInterface,
      providerOrSigner: ethers.providers.Provider | ethers.Signer,
    ) => ethers.Contract,
  ) {
    this.config = config;
    this.providerPool = providerPool;
    this.logger = rootLogger.getLogger('FullSync');
    this.statusUpdateCallbacks = [];
    this.chainSyncs = this.config.chains.map((chainConfig) => {
      const chainSync = new ChainSync(
        chainConfig.chainId,
        eventHandler,
        contractHandler,
        depositHandler,
        withdrawHandler,
        noteHandler,
        chainConfig,
        contractGenerator,
      );
      chainSync.onStatusUpdate(() => this.runCallbacks());
      return chainSync;
    });
    this.initIntervalMs = initIntervalMs || 10000;
    this.intervalMs = intervalMs || 300000;
  }

  public start() {
    if (!this.initTimer && !this.intervalTimer) {
      this.initTimer = setTimeout(() => {
        this.execute().then(() => {
          this.intervalTimer = setInterval(() => this.execute(), this.intervalMs);
        });
      }, this.initIntervalMs);
    }
  }

  public stop() {
    if (this.initTimer) {
      clearTimeout(this.initTimer);
    }
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }
  }

  public get status(): FullSyncStatus {
    const chains: { [key: number]: ChainSyncStatus } = {};
    this.chainSyncs.forEach((chainSync) => {
      chains[chainSync.chainId] = chainSync.status;
    });
    return { isSyncing: this.isSyncing, chainStatus: chains };
  }

  public onStatusUpdate(callback: (status: FullSyncStatus) => void) {
    this.statusUpdateCallbacks.push(callback);
  }

  public removeStatusUpdateCallback(callback: (status: FullSyncStatus) => void) {
    this.statusUpdateCallbacks = this.statusUpdateCallbacks.filter((cb) => cb !== callback);
  }

  public get isSyncing(): boolean {
    const chainSyncs = Object.values(this.chainSyncs);
    for (let index = 0; index < chainSyncs.length; index += 1) {
      if (chainSyncs[index].isSyncing) {
        return true;
      }
    }
    return false;
  }

  private execute(): Promise<SyncResult[]> {
    const promises: Array<Promise<SyncResult>> = [];
    this.chainSyncs.forEach((chainSync) => {
      const provider = this.providerPool.getProvider(chainSync.chainId);
      if (provider) {
        const promise = provider
          .getBlockNumber()
          .then((targetBlockNumber) => chainSync.execute(provider, targetBlockNumber))
          .catch((error) => {
            tracer.traceError(error);
            this.logger.warn(
              `failed to execute sync on chain(id=${chainSync.chainId}): ${errorMessage(error)}`,
            );
            return { syncedBlock: chainSync.syncedBlock, errors: [error] };
          });
        promises.push(promise);
      }
    });
    return Promise.all(promises);
  }

  private runCallbacks() {
    this.statusUpdateCallbacks.forEach((callback) => {
      try {
        callback(this.status);
      } catch (error) {
        this.logger.warn(`sync status update callback failed: ${errorMessage(error)}`);
      }
    });
  }
}
