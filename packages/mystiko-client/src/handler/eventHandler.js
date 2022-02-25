import { check, logger as rootLogger } from '@mystiko/utils';
import { Handler } from './handler.js';
import { Event } from '../model';

/**
 * @class EventHandler
 * @extends Handler
 * @param {module:mystiko/db.WrappedDb} db instance of {@link module:mystiko/db.WrappedDb}.
 * @param {MystikoConfig} config instance of {@link MystikoConfig}.
 * @desc handler class for operating smart contract event related resources.
 */
export class EventHandler extends Handler {
  constructor(db, config) {
    super(db, config);
    this.logger = rootLogger.getLogger('EventHandler');
  }

  /**
   * @desc add an emitted event into database.
   * @param {Object} data the raw data of the emitted event.
   * @param {number} data.chainId the chain id from where this event was emitted.
   * @param {string} data.contractAddress the smart contract address from where this event was emitted.
   * @param {string} data.transactionHash the transaction hash which includes this emitted event.
   * @param {string} data.topic the topic of this emitted event.
   * @param {Object} data.argumentData the arguments of this emitted event.
   * @returns {Promise<Event>} an stored {@link Event} object.
   */
  async addEvent({ chainId, contractAddress, transactionHash, topic, argumentData }) {
    let event = this._insertEvent({ chainId, contractAddress, transactionHash, topic, argumentData });
    await this.saveDatabase();
    return event;
  }

  /**
   * @desc add multiple emitted events into database.
   * @param {Array.<Object>} rawEvents the array of the raw event data.
   * @returns {Promise<Array.<Event>>} an array of {@link Event} objects.
   */
  async addEvents(rawEvents) {
    check(rawEvents instanceof Array, 'rawEvents should be an array');
    const events = rawEvents.map((rawEvent) => this._insertEvent(rawEvent));
    await this.saveDatabase();
    return events;
  }

  /**
   * @desc get the stored {@link Event} by chainId, transactionHash and topic.
   * @param {number} chainId the chain id from where this event was emitted.
   * @param {string} transactionHash the transaction hash which includes this emitted event.
   * @param {string} topic the transaction hash which includes this emitted event.
   * @returns {Event|undefined} the {@link Event} it found, otherwise it returns undefined.
   */
  getEvent(chainId, transactionHash, topic) {
    check(typeof chainId === 'number', 'chainId should be a number type');
    check(typeof transactionHash === 'string', 'transactionHash should be a string type');
    check(typeof topic === 'string', 'topic should be a string type');
    const eventData = this.db.events.findOne({ chainId, transactionHash, topic });
    return eventData ? new Event(eventData) : undefined;
  }

  /**
   * @desc get an array of {@link Event} with the given filtering/sorting/pagination criteria.
   * @param {object} [options={}] an object contains the search criteria.
   * @param {Function} [options.filterFunc] a filter function used as where clause. The filter function's
   * input is an instance of {@link Event}, it should return a boolean value to indicate whether that
   * record meets the criteria.
   * @param {string} [options.sortBy] specifies the sorting field, the returned array will be sorted based
   * that field.
   * @param {boolean} [options.desc] whether the returned array should be sorted in descending order.
   * @param {number} [options.offset] the starting offset for the returned array of instances. This is
   * normally used for pagination.
   * @param {number} [options.limit] the maximum number of instances this query should return. This is
   * normally used for pagination.
   * @returns {Event[]} an array of {@link Event} which meets the search criteria.
   */
  getEvents({ filterFunc, sortBy, desc, offset, limit } = {}) {
    let queryChain = this.db.events.chain();
    if (filterFunc) {
      queryChain = queryChain.where(filterFunc);
    }
    if (sortBy && typeof sortBy === 'string') {
      queryChain = queryChain.simplesort(sortBy, desc ? desc : false);
    }
    if (offset && typeof offset === 'number') {
      queryChain = queryChain.offset(offset);
    }
    if (limit && typeof limit === 'number') {
      queryChain = queryChain.limit(limit);
    }
    return queryChain.data().map((rawObject) => new Event(rawObject));
  }

  _insertEvent({ chainId, contractAddress, transactionHash, topic, argumentData }) {
    let event = this.getEvent(chainId, transactionHash, topic);
    if (!event) {
      event = new Event();
    }
    event.chainId = chainId;
    event.contractAddress = contractAddress;
    event.transactionHash = transactionHash;
    event.topic = topic;
    event.argumentData = argumentData;
    if (event.id) {
      this.db.events.update(event.data);
    } else {
      this.db.events.insert(event.data);
    }
    this.logger.debug(
      `added Event(id=${event.id}, chainId=${event.chainId}, ` +
        `transactionHash=${event.transactionHash}, topic=${event.topic}) into database`,
    );
    return event;
  }
}
