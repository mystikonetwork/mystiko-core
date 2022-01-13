import { BaseModel } from './common.js';
import { check, toBuff, toHexNoPrefix } from '../utils.js';

export class Account extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  get name() {
    return this.data['name'];
  }

  set name(n) {
    check(typeof n === 'string', 'n should be instance of string');
    this.data['name'] = n;
  }

  get verifyPublicKey() {
    const raw = this.data['verifyPublicKey'];
    return raw ? toBuff(raw) : undefined;
  }

  set verifyPublicKey(key) {
    check(key instanceof Buffer, 'key should be instance of Buffer');
    this.data['verifyPublicKey'] = toHexNoPrefix(key);
  }

  get encPublicKey() {
    const raw = this.data['encPublicKey'];
    return raw ? toBuff(raw) : undefined;
  }

  set encPublicKey(key) {
    check(key instanceof Buffer, 'key should be instance of Buffer');
    this.data['encPublicKey'] = toHexNoPrefix(key);
  }

  get encryptedVerifySecretKey() {
    return this.data['encryptedVerifySecretKey'];
  }

  set encryptedVerifySecretKey(encryptedKey) {
    check(typeof encryptedKey === 'string', 'encryptedKey should be instance of string');
    this.data['encryptedVerifySecretKey'] = encryptedKey;
  }

  get encryptedEncSecretKey() {
    return this.data['encryptedEncSecretKey'];
  }

  set encryptedEncSecretKey(encryptedKey) {
    check(typeof encryptedKey === 'string', 'encryptedKey should be instance of string');
    this.data['encryptedEncSecretKey'] = encryptedKey;
  }

  get walletId() {
    return this.data['walletId'];
  }

  set walletId(id) {
    check(typeof id === 'number', 'id should be instance of number');
    this.data['walletId'] = id;
  }

  get fullPublicKey() {
    if (this.verifyPublicKey && this.encPublicKey) {
      return this.protocol.fullPublicKey(this.verifyPublicKey, this.encPublicKey);
    }
    return undefined;
  }

  get shieldedAddress() {
    if (this.verifyPublicKey && this.encPublicKey) {
      return this.protocol.shieldedAddress(this.verifyPublicKey, this.encPublicKey);
    }
    return undefined;
  }
}
