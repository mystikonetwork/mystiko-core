import cryptojs from 'crypto-js';
import hmacSHA512 from 'crypto-js/hmac-sha512';
import aes from 'crypto-js/aes';

export class Handler {
  constructor(db, options) {
    this.db = db;
    this.options = options;
  }

  get db() {
    return this.db;
  }

  get options() {
    return this.options;
  }

  saveDatabase() {
    let promiseResolve, promiseReject;
    const promise = new Promise((resolve, reject) => {
      promiseResolve = resolve;
      promiseReject = reject;
    });
    this.db.saveDatabase((err) => {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve();
      }
    });
    return promise;
  }

  static aesEncrypt(data, password) {
    return aes.encrypt(data, password).toString();
  }

  static aesDecrypt(cipherText, password) {
    return aes.decrypt(cipherText, password).toString(cryptojs.enc.Utf8);
  }

  static hmacSHA512(data, salt) {
    return hmacSHA512(data, salt).toString();
  }
}
