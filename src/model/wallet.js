import { BaseModel } from './common.js';

export class Wallet extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  get encryptedMasterSeed() {
    return this.data['encryptedMasterSeed'];
  }

  set encryptedMasterSeed(encSeed) {
    this.data['encryptedMasterSeed'] = encSeed;
  }

  get hashedPassword() {
    return this.data['hashedPassword'];
  }

  set hashedPassword(hashedPass) {
    this.data['hashedPassword'] = hashedPass;
  }

  get accountNonce() {
    return this.data['accountNonce'];
  }

  set accountNonce(nonce) {
    this.data['accountNonce'] = nonce;
  }
}
