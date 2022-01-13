import { check } from '../utils.js';
import { BaseModel } from './common.js';

export class Wallet extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  get encryptedMasterSeed() {
    return this.data['encryptedMasterSeed'];
  }

  set encryptedMasterSeed(encSeed) {
    check(typeof encSeed === 'string', 'encSeed should be instance of string');
    this.data['encryptedMasterSeed'] = encSeed;
  }

  get hashedPassword() {
    return this.data['hashedPassword'];
  }

  set hashedPassword(hashedPass) {
    check(typeof hashedPass === 'string', 'hashedPass should be instance of string');
    this.data['hashedPassword'] = hashedPass;
  }

  get accountNonce() {
    return this.data['accountNonce'];
  }

  set accountNonce(nonce) {
    check(typeof nonce === 'number', 'nonce should be instance of number');
    this.data['accountNonce'] = nonce;
  }
}
