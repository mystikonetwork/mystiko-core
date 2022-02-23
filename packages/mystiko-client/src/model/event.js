import { ethers } from 'ethers';

import { BaseModel } from './common.js';
import { check } from '@mystiko/utils';

/**
 * @class Event
 * @extends BaseModel
 * @param {Object} [data={}] raw data of the Account model.
 * @desc data model of storing smart contract event related data.
 */
export class Event extends BaseModel {
  constructor(data) {
    super(data);
  }

  /**
   * @property {number} chainId
   * @desc the chain id where this event was emitted.
   */
  get chainId() {
    return this.data['chainId'];
  }

  set chainId(id) {
    check(typeof id === 'number', 'id should be instance of number');
    this.data['chainId'] = id;
  }

  /**
   * @property {string} contractAddress
   * @desc the smart contract address from where this event was emitted.
   */
  get contractAddress() {
    return this.data['contractAddress'];
  }

  set contractAddress(addr) {
    check(ethers.utils.isAddress(addr), `addr ${addr} is invalid address`);
    this.data['contractAddress'] = addr;
  }

  /**
   * @property {string} topic
   * @desc the topic name of this emitted event.
   */
  get topic() {
    return this.data['topic'];
  }

  set topic(eventTopic) {
    check(typeof eventTopic === 'string', 'eventTopic should be a string type');
    this.data['topic'] = eventTopic;
  }

  /**
   * @property {string} transactionHash
   * @desc the transaction hash from where this event was emitted.
   */
  get transactionHash() {
    return this.data['transactionHash'];
  }

  set transactionHash(hash) {
    check(typeof hash === 'string', 'address should be instance of string');
    this.data['transactionHash'] = hash;
  }

  /**
   * @property {Object} argumentData
   * @desc the arguments of this emitted event.
   */
  get argumentData() {
    return this.data['argumentData'];
  }

  set argumentData(args) {
    check(args, 'args cannot be null or undefined');
    this.data['argumentData'] = args;
  }
}
