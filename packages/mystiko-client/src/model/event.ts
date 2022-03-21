import { ethers } from 'ethers';
import { check } from '@mystikonetwork/utils';
import { BaseModel } from './common';

export interface RawEvent {
  chainId?: number;
  contractAddress?: string;
  topic?: string;
  blockNumber?: number;
  transactionHash?: string;
  argumentData?: any;
}

/**
 * @class Event
 * @extends BaseModel
 * @param {Object} [data={}] raw data of the Account model.
 * @desc data model of storing smart contract event related data.
 */
export class Event extends BaseModel {
  constructor(data: Object = {}) {
    super(data);
  }

  /**
   * @property {number | undefined } chainId
   * @desc the chain id where this event was emitted.
   */
  public get chainId(): number | undefined {
    return this.asRawEvent().chainId;
  }

  public set chainId(id: number | undefined) {
    this.asRawEvent().chainId = id;
  }

  /**
   * @property {string | undefined} contractAddress
   * @desc the smart contract address from where this event was emitted.
   */
  public get contractAddress(): string | undefined {
    return this.asRawEvent().contractAddress;
  }

  public set contractAddress(addr: string | undefined) {
    check(!addr || ethers.utils.isAddress(addr), `${addr} is an invalid address`);
    this.asRawEvent().contractAddress = addr;
  }

  /**
   * @property {string | undefined} topic
   * @desc the topic name of this emitted event.
   */
  public get topic(): string | undefined {
    return this.asRawEvent().topic;
  }

  public set topic(eventTopic: string | undefined) {
    this.asRawEvent().topic = eventTopic;
  }

  /**
   * @property {string | undefined} transactionHash
   * @desc the transaction hash from where this event was emitted.
   */
  public get transactionHash(): string | undefined {
    return this.asRawEvent().transactionHash;
  }

  public set transactionHash(hash: string | undefined) {
    this.asRawEvent().transactionHash = hash;
  }

  public get blockNumber(): number {
    return this.asRawEvent().blockNumber || 0;
  }

  public set blockNumber(block: number) {
    check(block > 0, `blockNumber ${block} is less or equal to 0`);
    this.asRawEvent().blockNumber = block;
  }

  /**
   * @property {Object | undefined} argumentData
   * @desc the arguments of this emitted event.
   */
  public get argumentData(): any {
    return this.asRawEvent().argumentData;
  }

  public set argumentData(args: any) {
    this.asRawEvent().argumentData = args;
  }

  private asRawEvent(): RawEvent {
    return this.data as RawEvent;
  }
}
