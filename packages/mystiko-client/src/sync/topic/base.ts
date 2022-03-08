import { ContractInterface, ethers } from 'ethers';
import { Logger } from 'loglevel';
import { errorMessage, logger as rootLogger } from '@mystiko/utils';
import { BaseSync, SyncResult } from '../base';
import { Contract, RawEvent } from '../../model';
import { ContractHandler, EventHandler } from '../../handler';
import tracer from '../../tracing';

export interface TopicSyncStatus {
  contract: Contract;
  topic: string;
  isSyncing: boolean;
  syncedBlock: number;
  error?: any;
}

export abstract class TopicSync implements BaseSync {
  public readonly topic: string;

  protected readonly contract: Contract;

  protected readonly eventHandler: EventHandler;

  protected readonly contractHandler: ContractHandler;

  protected readonly syncSize: number;

  protected readonly contractGenerator: (
    address: string,
    abi: ContractInterface,
    providerOrSigner: ethers.providers.Provider | ethers.Signer,
  ) => ethers.Contract;

  protected readonly storeEvent: boolean;

  protected readonly logger: Logger;

  protected syncing: boolean;

  protected error?: any;

  protected constructor(
    contract: Contract,
    topic: string,
    eventHandler: EventHandler,
    contractHandler: ContractHandler,
    syncSize: number,
    contractGenerator?: (
      address: string,
      abi: ContractInterface,
      providerOrSigner: ethers.providers.Provider | ethers.Signer,
    ) => ethers.Contract,
    storeEvent?: boolean,
  ) {
    this.contract = contract;
    this.topic = topic;
    this.eventHandler = eventHandler;
    this.contractHandler = contractHandler;
    this.syncSize = syncSize;
    this.logger = rootLogger.getLogger('TopicSync');
    this.syncing = false;
    this.storeEvent = storeEvent || false;
    if (contractGenerator) {
      this.contractGenerator = contractGenerator;
    } else {
      this.contractGenerator = (
        address: string,
        abi: ContractInterface,
        providerOrSigner: ethers.providers.Provider | ethers.Signer,
      ) => new ethers.Contract(address, abi, providerOrSigner);
    }
  }

  public execute(provider: ethers.providers.Provider, targetBlockNumber: number): Promise<SyncResult> {
    if (!this.syncing) {
      const etherContract = this.getEtherContract(provider);
      if (etherContract) {
        this.error = undefined;
        this.updateStatus(true);
        return this.executeChain(etherContract, targetBlockNumber)
          .then((result) => {
            this.updateStatus(false);
            return { syncedBlock: result, errors: [] };
          })
          .catch((error) => {
            tracer.traceError(error);
            this.error = error;
            this.updateStatus(false);
            this.logger.warn(`${this.logPrefix} failed to sync: ${errorMessage(error)}`);
            return { syncedBlock: this.syncedBlock, errors: [error] };
          });
      }
    }
    return Promise.resolve({ syncedBlock: this.syncedBlock, errors: [] });
  }

  public get syncedBlock(): number {
    return this.contract.getSyncedTopicBlock(this.topic);
  }

  public get status(): TopicSyncStatus {
    return {
      contract: this.contract,
      topic: this.topic,
      isSyncing: this.isSyncing,
      syncedBlock: this.syncedBlock,
      error: this.error,
    };
  }

  protected abstract handleEvents(events: RawEvent[]): Promise<void>;

  protected abstract parseArguments(args?: ethers.utils.Result): any;

  protected get logPrefix(): string {
    return `[chainId=${this.contract.chainId}][address=${this.contract.address}][topic=${this.topic}]`;
  }

  public get isSyncing(): boolean {
    return this.syncing;
  }

  private executeChain(etherContract: ethers.Contract, targetBlockNumber: number): Promise<number> {
    const fromBlockNumber = this.contract.getSyncedTopicBlock(this.topic) + 1;
    if (fromBlockNumber <= targetBlockNumber) {
      const toBlockNumber =
        fromBlockNumber + this.syncSize - 1 < targetBlockNumber
          ? fromBlockNumber + this.syncSize - 1
          : targetBlockNumber;
      const filter = etherContract.filters[this.topic]();
      this.logger.debug(`${this.logPrefix} start syncing from ${fromBlockNumber} to ${toBlockNumber}`);
      return etherContract
        .queryFilter(filter, fromBlockNumber, toBlockNumber)
        .then((events: ethers.Event[]) => {
          const rawEvents = events.map((event: ethers.Event) => {
            const rawEvent: RawEvent = {
              chainId: this.contract.chainId,
              topic: this.topic,
              contractAddress: this.contract.address,
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
              argumentData: this.parseArguments(event.args),
            };
            return rawEvent;
          });
          if (this.storeEvent) {
            return this.handleEvents(rawEvents).then(() => this.eventHandler.addEvents(rawEvents));
          }
          return rawEvents;
        })
        .then(() => {
          this.contract.setSyncedTopicBlock(this.topic, toBlockNumber);
          return this.contractHandler.updateContract(this.contract).then(() => toBlockNumber);
        })
        .then(() => {
          this.logger.debug(`${this.logPrefix} finished syncing from ${fromBlockNumber} to ${toBlockNumber}`);
          return this.executeChain(etherContract, targetBlockNumber);
        });
    }
    return Promise.resolve(this.syncedBlock);
  }

  private updateStatus(syncingFlag: boolean) {
    if (this.syncing !== syncingFlag) {
      this.syncing = syncingFlag;
    }
  }

  private getEtherContract(provider: ethers.providers.Provider): ethers.Contract | undefined {
    if (this.contract.address) {
      try {
        return this.contractGenerator(this.contract.address, this.contract.abi, provider);
      } catch (error) {
        this.logger.warn(`${this.logPrefix} failed to create contract instance: ${errorMessage(error)}`);
      }
    }
    return undefined;
  }
}
