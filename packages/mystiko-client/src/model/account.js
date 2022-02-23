import { check, toBuff, toHexNoPrefix } from '@mystiko/utils';
import { BaseModel } from './common.js';

/**
 * @class Account
 * @extends BaseModel
 * @param {Object} [data={}] raw data of the Account model.
 * @desc data model class for storing account related data.
 */
export class Account extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  /**
   * @property {string} name
   * @desc name of this account.
   */
  get name() {
    return this.data['name'];
  }

  set name(n) {
    check(typeof n === 'string', 'n should be instance of string');
    this.data['name'] = n;
  }

  /**
   * @property {string} verifyPublicKey
   * @desc public key for zkp verification.
   */
  get verifyPublicKey() {
    const raw = this.data['verifyPublicKey'];
    return raw ? toBuff(raw) : undefined;
  }

  set verifyPublicKey(key) {
    check(Buffer.isBuffer(key), 'key should be instance of Buffer');
    this.data['verifyPublicKey'] = toHexNoPrefix(key);
  }

  /**
   * @property {string} encPublicKey
   * @desc public key for data asymmetric encryption.
   */
  get encPublicKey() {
    const raw = this.data['encPublicKey'];
    return raw ? toBuff(raw) : undefined;
  }

  set encPublicKey(key) {
    check(Buffer.isBuffer(key), 'key should be instance of Buffer');
    this.data['encPublicKey'] = toHexNoPrefix(key);
  }

  /**
   * @property {string} encryptedVerifySecretKey
   * @desc encrypted secret key for zkp verification.
   * The encryption is done by symmetric encryption with the wallet password.
   */
  get encryptedVerifySecretKey() {
    return this.data['encryptedVerifySecretKey'];
  }

  set encryptedVerifySecretKey(encryptedKey) {
    check(typeof encryptedKey === 'string', 'encryptedKey should be instance of string');
    this.data['encryptedVerifySecretKey'] = encryptedKey;
  }

  /**
   * @property {string} encryptedEncSecretKey
   * @desc encrypted secret key for the asymmetric encryption.
   * The encryption is done by symmetric encryption with the wallet password.
   */
  get encryptedEncSecretKey() {
    return this.data['encryptedEncSecretKey'];
  }

  set encryptedEncSecretKey(encryptedKey) {
    check(typeof encryptedKey === 'string', 'encryptedKey should be instance of string');
    this.data['encryptedEncSecretKey'] = encryptedKey;
  }

  /**
   * @property {number} walletId
   * @desc wallet id of this account associated with.
   */
  get walletId() {
    return this.data['walletId'];
  }

  set walletId(id) {
    check(typeof id === 'number', 'id should be instance of number');
    this.data['walletId'] = id;
  }

  /**
   * @property {string|undefined} fullPublicKey
   * @desc full public key combined with public key for verification and public key for encryption.
   * If the {@link Account#verifyPublicKey} or {@link Account#encPublicKey} is undefined,
   * it will return undefined as value.
   */
  get fullPublicKey() {
    if (this.verifyPublicKey && this.encPublicKey) {
      return this.protocol.fullPublicKey(this.verifyPublicKey, this.encPublicKey);
    }
    return undefined;
  }

  /**
   * @property {string|undefined} shieldedAddress
   * @desc the shielded address calculated from {@link Account#fullPublicKey}. It will be
   * used as the receiving address in the deposit transaction.
   * If the {@link Account#verifyPublicKey} or {@link Account#encPublicKey} is undefined,
   * it will return undefined as value.
   */
  get shieldedAddress() {
    if (this.verifyPublicKey && this.encPublicKey) {
      return this.protocol.shieldedAddress(this.verifyPublicKey, this.encPublicKey);
    }
    return undefined;
  }
}
