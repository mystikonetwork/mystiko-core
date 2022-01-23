import { check } from '../utils.js';
import { BaseModel } from './common.js';

/**
 * @class Wallet
 * @extends BaseModel
 * @param {Object} [data={}] raw data of the Account model.
 * @desc data model for storing wallet related data.
 */
export class Wallet extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  /**
   * @property {string} encryptedMasterSeed
   * @desc encrypted master seed of this wallet.
   */
  get encryptedMasterSeed() {
    return this.data['encryptedMasterSeed'];
  }

  set encryptedMasterSeed(encSeed) {
    check(typeof encSeed === 'string', 'encSeed should be instance of string');
    this.data['encryptedMasterSeed'] = encSeed;
  }

  /**
   * @property {string} hashedPassword
   * @desc hashed password of this wallet.
   */
  get hashedPassword() {
    return this.data['hashedPassword'];
  }

  set hashedPassword(hashedPass) {
    check(typeof hashedPass === 'string', 'hashedPass should be instance of string');
    this.data['hashedPassword'] = hashedPass;
  }

  /**
   * @property {number} accountNonce
   * @desc nonce for account creation. This field is used store the number of account
   * which this wallet has created.
   */
  get accountNonce() {
    return this.data['accountNonce'];
  }

  set accountNonce(nonce) {
    check(typeof nonce === 'number', 'nonce should be instance of number');
    this.data['accountNonce'] = nonce;
  }
}
