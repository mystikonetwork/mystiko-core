import { checkDefinedAndNotNull } from '../utils.js';
import protocol from '../protocol/index.js';

export class Handler {
  constructor(db, options) {
    checkDefinedAndNotNull(db, 'db cannot be null or undefined');
    this.db = db;
    this.options = options ? options : {};
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
