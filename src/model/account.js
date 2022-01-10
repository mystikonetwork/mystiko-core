import { BaseModel } from './common.js';
import bs58 from 'bs58';

export const VERIFY_PUBLIC_KEY_LEN = 32;
export const ENC_PUBLIC_KEY_LEN = 33;
export const FULL_PUBLIC_KEY_LEN = VERIFY_PUBLIC_KEY_LEN + ENC_PUBLIC_KEY_LEN;
export const VERIFY_SECRET_KEY_LEN = 32;
export const ENC_SECRET_KEY_LEN = 32;
export class Account extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  get name() {
    return this.data['name'];
  }

  set name(n) {
    this.data['name'] = n;
  }

  get verifyPublicKey() {
    return this.data['verifyPublicKey'];
  }

  set verifyPublicKey(key) {
    this.data['verifyPublicKey'] = key;
  }

  get encPublicKey() {
    return this.data['encPublicKey'];
  }

  set encPublicKey(key) {
    this.data['encPublicKey'] = key;
  }

  get encryptedVerifySecretKey() {
    return this.data['encryptedVerifySecretKey'];
  }

  set encryptedVerifySecretKey(encryptedKey) {
    this.data['encryptedVerifySecretKey'] = encryptedKey;
  }

  get encryptedEncSecretKey() {
    return this.data['encryptedEncSecretKey'];
  }

  set encryptedEncSecretKey(encryptedKey) {
    this.data['encryptedEncSecretKey'] = encryptedKey;
  }

  get walletId() {
    return this.data['walletId'];
  }

  set walletId(id) {
    this.data['walletId'] = id;
  }

  get fullPublicKey() {
    if (this.verifyPublicKey && this.encPublicKey) {
      const verifyPublicKey = Buffer.from(this.verifyPublicKey, 'hex');
      const encPublicKey = Buffer.from(this.encPublicKey, 'hex');
      const fullPublicKey = Buffer.concat([verifyPublicKey, encPublicKey]);
      return fullPublicKey.toString('hex');
    }
    return undefined;
  }

  get shieldedAddress() {
    if (this.verifyPublicKey && this.encPublicKey) {
      const verifyPublicKey = Buffer.from(this.verifyPublicKey, 'hex');
      const encPublicKey = Buffer.from(this.encPublicKey, 'hex');
      const fullPublicKey = Buffer.concat([verifyPublicKey, encPublicKey]);
      return bs58.encode(fullPublicKey);
    }
    return undefined;
  }

  static isValidShieldedAddress(shieldedAddress) {
    try {
      const keys = bs58.decode(shieldedAddress);
      if (keys.length != FULL_PUBLIC_KEY_LEN) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  static getPublicKeys(shieldedAddress) {
    if (!this.isValidShieldedAddress(shieldedAddress)) {
      throw 'cannot get public keys from invalid address';
    }
    const keyBytes = bs58.decode(shieldedAddress);
    return [
      keyBytes.slice(0, VERIFY_PUBLIC_KEY_LEN).toString('hex'),
      keyBytes.slice(VERIFY_PUBLIC_KEY_LEN, FULL_PUBLIC_KEY_LEN).toString('hex'),
    ];
  }

  static getSecretKeys(secretKey) {
    const expectedLength = VERIFY_SECRET_KEY_LEN + ENC_SECRET_KEY_LEN;
    const secretKeyBytes = Buffer.from(secretKey, 'hex');
    if (secretKeyBytes.length != expectedLength) {
      throw 'invalid account secret key length, it should be ' + expectedLength;
    }
    return [
      secretKeyBytes.slice(0, VERIFY_SECRET_KEY_LEN).toString('hex'),
      secretKeyBytes.slice(VERIFY_SECRET_KEY_LEN, expectedLength).toString('hex'),
    ];
  }
}
