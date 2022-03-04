import { ethers } from 'ethers';
import { Logger } from 'loglevel';
import { errorMessage, logger as rootLogger } from '@mystiko/utils';
import BaseSync from '../base';
import { Contract, RawEvent } from '../../model';
import { ContractHandler, EventHandler } from '../../handler';

export default abstract class TopicSync implements BaseSync {
  protected readonly topic: string;

  protected readonly contract: Contract;

  protected readonly etherContract: ethers.Contract;

  protected readonly eventHandler: EventHandler;

  protected readonly contractHandler: ContractHandler;

  protected readonly syncSize: number;

  protected readonly logger: Logger;

  protected syncing: boolean;

  protected constructor(
    contract: Contract,
    etherContract: ethers.Contract,
    topic: string,
    eventHandler: EventHandler,
    contractHandler: ContractHandler,
    syncSize: number,
  ) {
    this.contract = contract;
    this.etherContract = etherContract;
    this.topic = topic;
    this.eventHandler = eventHandler;
    this.contractHandler = contractHandler;
    this.syncSize = syncSize;
    this.logger = rootLogger.getLogger('TopicSync');
    this.syncing = false;
  }

  public execute(targetBlockNumber: number): Promise<number> {
    this.syncing = true;
    return this.executeChain(targetBlockNumber)
      .then((result) => {
        this.syncing = false;
        return result;
      })
      .catch((error) => {
        this.syncing = false;
        this.logger.warn(`${this.logPrefix} failed to sync: ${errorMessage(error)}`);
        return this.syncedBlock;
      });
  }

  public get syncedBlock(): number {
    return this.contract.getSyncedTopicBlock(this.topic);
  }

  protected abstract handleEvents(events: RawEvent[]): Promise<void>;

  protected get logPrefix(): string {
    return `[chainId=${this.contract.chainId}][address=${this.contract.address}][topic=${this.topic}]`;
  }

  public get isSyncing(): boolean {
    return this.syncing;
  }

  private executeChain(targetBlockNumber: number): Promise<number> {
    const fromBlockNumber = this.contract.getSyncedTopicBlock(this.topic) + 1;
    if (fromBlockNumber <= targetBlockNumber) {
      const toBlockNumber =
        fromBlockNumber + this.syncSize - 1 < targetBlockNumber
          ? fromBlockNumber + this.syncSize - 1
          : targetBlockNumber;
      const filter = this.etherContract.filters[this.topic]();
      this.logger.info(`${this.logPrefix} start syncing from ${fromBlockNumber} to ${toBlockNumber}`);
      return this.etherContract
        .queryFilter(filter, fromBlockNumber, toBlockNumber)
        .then((events: ethers.Event[]) => {
          const rawEvents = events.map((event: ethers.Event) => {
            const rawEvent: RawEvent = {
              chainId: this.contract.chainId,
              topic: this.topic,
              contractAddress: this.contract.address,
              argumentData: event.args,
            };
            return rawEvent;
          });
          return this.handleEvents(rawEvents).then(() => this.eventHandler.addEvents(rawEvents));
        })
        .then(() => {
          this.contract.setSyncedTopicBlock(this.topic, toBlockNumber);
          return this.contractHandler.updateContract(this.contract).then(() => toBlockNumber);
        })
        .then(() => {
          this.logger.info(`${this.logPrefix} finished syncing from ${fromBlockNumber} to ${toBlockNumber}`);
          return this.executeChain(targetBlockNumber);
        });
    }
    return Promise.resolve(this.syncedBlock);
  }
}
