import { MystikoConfig } from '@mystiko/config';
import { logger as rootLogger } from '@mystiko/utils';
import { Handler } from './handler';
import { Event, RawEvent } from '../model';
import { MystikoDatabase } from '../database';

interface QueryParams {
  filterFunc?: (event: Event) => boolean;
  sortBy?: string;
  desc?: boolean;
  offset?: number;
  limit?: number;
}

/**
 * @class EventHandler
 * @extends Handler
 * @param {MystikoDatabase} db instance of {@link MystikoDatabase}.
 * @param {MystikoConfig} config instance of {@link MystikoConfig}.
 * @desc handler class for operating smart contract event related resources.
 */
export class EventHandler extends Handler {
  constructor(db: MystikoDatabase, config?: MystikoConfig) {
    super(db, config);
    this.logger = rootLogger.getLogger('EventHandler');
  }

  /**
   * @desc add an emitted event into database.
   * @param {RawEvent} rawEvent the raw data of the emitted event.
   * @param {number} rawEvent.chainId the chain id from where this event was emitted.
   * @param {string} rawEvent.contractAddress the smart contract address from where this event was emitted.
   * @param {string} rawEvent.transactionHash the transaction hash which includes this emitted event.
   * @param {string} rawEvent.topic the topic of this emitted event.
   * @param {Object} rawEvent.argumentData the arguments of this emitted event.
   * @returns {Promise<Event>} an stored {@link Event} object.
   */
  public async addEvent(rawEvent: RawEvent): Promise<Event> {
    const event = this.insertEvent(rawEvent);
    await this.saveDatabase();
    return event;
  }

  /**
   * @desc add multiple emitted events into database.
   * @param {Array.<RawEvent>} rawEvents the array of the raw event data.
   * @returns {Promise<Array.<Event>>} an array of {@link Event} objects.
   */
  public async addEvents(rawEvents: RawEvent[]): Promise<Event[]> {
    const events = rawEvents.map((rawEvent) => this.insertEvent(rawEvent));
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
  public getEvent(chainId: number, transactionHash: string, topic: string): Event | undefined {
    const eventData = this.db.events.findOne({ chainId, transactionHash, topic });
    return eventData ? new Event(eventData) : undefined;
  }

  /**
   * @desc get an array of {@link Event} with the given filtering/sorting/pagination criteria.
   * @param {QueryParams} [queryParams={}] an object contains the search criteria.
   * @param {Function} [queryParams.filterFunc] a filter function used as where clause. The filter function's
   * input is an instance of {@link Event}, it should return a boolean value to indicate whether that
   * record meets the criteria.
   * @param {string} [queryParams.sortBy] specifies the sorting field, the returned array will be sorted based
   * that field.
   * @param {boolean} [queryParams.desc] whether the returned array should be sorted in descending order.
   * @param {number} [queryParams.offset] the starting offset for the returned array of instances. This is
   * normally used for pagination.
   * @param {number} [queryParams.limit] the maximum number of instances this query should return. This is
   * normally used for pagination.
   * @returns {Event[]} an array of {@link Event} which meets the search criteria.
   */
  public getEvents(queryParams: QueryParams = {}) {
    const { filterFunc, sortBy, desc, offset, limit } = queryParams;
    let queryChain = this.db.events.chain();
    if (filterFunc) {
      queryChain = queryChain.where((rawEvent: Object) => filterFunc(new Event(rawEvent)));
    }
    if (sortBy) {
      queryChain = queryChain.simplesort(sortBy, desc || false);
    }
    if (offset) {
      queryChain = queryChain.offset(offset);
    }
    if (limit) {
      queryChain = queryChain.limit(limit);
    }
    return queryChain.data().map((rawObject) => new Event(rawObject));
  }

  public async removeEvents(filterFunc?: (event: Event) => boolean): Promise<Event[]> {
    const events = this.getEvents({ filterFunc });
    events.forEach((event: Event) => {
      this.db.events.remove(event.data);
    });
    await this.saveDatabase();
    return Promise.resolve(events);
  }

  private insertEvent(eventParams: RawEvent): Event {
    const { chainId, contractAddress, transactionHash, topic, argumentData } = eventParams;
    let event: Event | undefined;
    if (chainId && transactionHash && topic) {
      event = this.getEvent(chainId, transactionHash, topic);
    }
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
