import { Handler } from './handler.js';
import { Event } from '../model';
import { check } from '../utils.js';
import rootLogger from '../logger';

/**
 * @class EventHandler
 */
export class EventHandler extends Handler {
  constructor(db, config) {
    super(db, config);
    this.logger = rootLogger.getLogger('EventHandler');
  }

  async addEvent({ chainId, contractAddress, transactionHash, topic, argumentData }) {
    let event = this._insertEvent({ chainId, contractAddress, transactionHash, topic, argumentData });
    await this.saveDatabase();
    return event;
  }

  async addEvents(rawEvents) {
    check(rawEvents instanceof Array, 'rawEvents should be an array');
    const events = rawEvents.map((rawEvent) => this._insertEvent(rawEvent));
    await this.saveDatabase();
    return events;
  }

  getEvent(chainId, transactionHash, topic) {
    check(typeof chainId === 'number', 'chainId should a number type');
    check(typeof transactionHash === 'string', 'transactionHash should a string type');
    check(typeof topic === 'string', 'topic should a string type');
    const eventData = this.db.events.findOne({ chainId, transactionHash, topic });
    return eventData ? new Event(eventData) : undefined;
  }

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
