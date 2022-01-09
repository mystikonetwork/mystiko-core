import { BaseModel } from './common.js';

export class Account extends BaseModel {
  constructor(data = {}) {
    super(data);
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
}
