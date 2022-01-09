import { babyJub, eddsa } from 'circomlib';
import {
  PrivateKey as EciesPrivateKey,
  encrypt as eciesEncrypt,
  decrypt as eciesDecrypt
} from 'eciesjs';
import { randomBytes } from 'crypto';

export class Account {
  constructor(verifyPrivateKey = null, encPrivateKey = null) {
    if (verifyPrivateKey == null) {
      verifyPrivateKey = randomBytes(32);
    }
    if (encPrivateKey == null) {
      encPrivateKey = randomBytes(32);
    }
    if (!(verifyPrivateKey instanceof Buffer) || !(encPrivateKey instanceof Buffer)) {
      throw 'private keys should be Buffer instance';
    }
    this.verifyPrivateKey = verifyPrivateKey;
    const unpackedVerifyPublicKey = eddsa.prv2pub(verifyPrivateKey);
    this.verifyPublicKey = Buffer.from(babyJub.packPoint(unpackedVerifyPublicKey));
    this.encPrivateKey = encPrivateKey;
    this.encPublicKey = new EciesPrivateKey(encPrivateKey).publicKey.compressed;
  }

  get fullPublicKey() {
    return Buffer.concat([this.verifyPublicKey, this.encPublicKey]);
  }

  encrypt(plainText) {
    return eciesEncrypt(this.encPublicKey, plainText);
  }

  decrypt(encryptedData) {
    return eciesDecrypt(this.encPrivateKey, encryptedData);
  }
}
