import { check, checkDefinedAndNotNull } from '@mystiko/utils';
import * as protocol from '../protocol';
import { MystikoConfig } from '../config';
import rootLogger from '../logger';

/**
 * @class Handler
 * @desc base Handler class for operating resources and implementing business logic.
 */
export class Handler {
  constructor(db, config) {
    checkDefinedAndNotNull(db, 'db cannot be null or undefined');
    if (config) {
      check(config instanceof MystikoConfig, 'wrong config instance');
      this.config = config;
    } else {
      this.config = new MystikoConfig({ version: '1.0' });
    }
    this.db = db;
    /**
     * @property {module:mystiko/protocol/default} protocol
     * @desc default implementation of Mystiko protocol
     */
    this.protocol = protocol;
    this.logger = rootLogger.getLogger('Handler');
  }

  /**
   * @desc save Loki database into persistent layer.
   * @returns {Promise<?>} a promise object indicate the success or failure for this saving operation.
   */
  saveDatabase() {
    let promiseResolve, promiseReject;
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
