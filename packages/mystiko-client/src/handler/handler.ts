import { Logger } from 'loglevel';
import { MystikoConfig } from '@mystikonetwork/config';
import { v1Protocol, V1ProtocolInterface } from '@mystikonetwork/protocol';
import { logger as rootLogger } from '@mystikonetwork/utils';
import { MystikoDatabase } from '../database';

/**
 * @class Handler
 * @desc base Handler class for operating resources and implementing business logic.
 */
export class Handler {
  protected readonly config: MystikoConfig;

  protected readonly db: MystikoDatabase;

  protected readonly protocol: V1ProtocolInterface;

  protected logger: Logger;

  constructor(db: MystikoDatabase, config?: MystikoConfig) {
    this.config = config || new MystikoConfig({ version: '1.0' });
    this.db = db;
    this.protocol = v1Protocol;
    this.logger = rootLogger.getLogger('Handler');
  }

  /**
   * @desc save Loki database into persistent layer.
   * @returns {Promise<?>} a promise object indicate the success or failure for this saving operation.
   */
  public saveDatabase(): Promise<unknown> {
    let promiseResolve: (value: void | PromiseLike<void>) => void;
    let promiseReject: (reason?: any) => void;
    const promise = new Promise((resolve, reject) => {
      promiseResolve = resolve;
      promiseReject = reject;
    });
    this.db.database.saveDatabase((err) => {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve();
      }
    });
    return promise;
  }
}
