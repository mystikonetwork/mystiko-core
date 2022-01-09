import { babyJub, eddsa } from 'circomlib';
import { PrivateKey as EciesPrivateKey, encrypt as eciesEncrypt, decrypt as eciesDecrypt } from 'eciesjs';
import { randomBytes } from 'crypto';
import bs58 from 'bs58';

export const VERIFY_PUBLIC_KEY_LEN = 32;
export const ENC_PUBLIC_KEY_LEN = 33;
export const FULL_PUBLIC_KEY_LEN = VERIFY_PUBLIC_KEY_LEN + ENC_PUBLIC_KEY_LEN;
export const VERIFY_SECRET_KEY_LEN = 32;
export const ENC_SECRET_KEY_LEN = 32;
export class Account {
  constructor(verifyPrivateKey = null, encPrivateKey = null) {
    if (verifyPrivateKey == null) {
      verifyPrivateKey = randomBytes(VERIFY_SECRET_KEY_LEN);
    }
    if (encPrivateKey == null) {
      encPrivateKey = randomBytes(ENC_SECRET_KEY_LEN);
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

  get address() {
    return bs58.encode(this.fullPublicKey);
  }

  static encrypt(encPublicKey, plainText) {
    return eciesEncrypt(encPublicKey, plainText);
  }

  static decrypt(encPrivateKey, encryptedData) {
    return eciesDecrypt(encPrivateKey, encryptedData);
  }

  static isValidAddress(address) {
    try {
      const keys = bs58.decode(address);
      if (keys.length != FULL_PUBLIC_KEY_LEN) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  static getPublicKeys(address) {
    if (!this.isValidAddress(address)) {
      throw 'cannot get public keys from invalid address';
    }
    const keyBytes = bs58.decode(address);
    return [
      keyBytes.slice(0, VERIFY_PUBLIC_KEY_LEN),
      keyBytes.slice(VERIFY_PUBLIC_KEY_LEN, FULL_PUBLIC_KEY_LEN),
    ];
  }
}
