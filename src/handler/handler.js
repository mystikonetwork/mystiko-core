import { check, checkDefinedAndNotNull } from '../utils.js';
import protocol from '../protocol/index.js';
import { MystikoConfig } from '../config/index.js';

export class Handler {
  constructor(db, config) {
    checkDefinedAndNotNull(db, 'db cannot be null or undefined');
    if (config) {
      check(config instanceof MystikoConfig, 'wrong config instance');
      this.config = config;
    } else {
      this.config = new MystikoConfig({});
    }
    this.db = db;
    this.protocol = protocol;
  }

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
