import { toBuff, toHexNoPrefix } from '@mystikonetwork/utils';
import { BaseModel } from './common';

export interface RawAccount {
  name?: string;
  verifyPublicKey?: string;
  encPublicKey?: string;
  encryptedVerifySecretKey?: string;
  encryptedEncSecretKey?: string;
  walletId?: number;
}

/**
 * @class Account
 * @extends BaseModel
 * @param {Object} [data={}] raw data of the Account model.
 * @desc data model class for storing account related data.
 */
export class Account extends BaseModel {
  constructor(data: Object = {}) {
    super(data);
  }

  /**
   * @property {string | undefined} name
   * @desc name of this account.
   */
  public get name(): string | undefined {
    return this.asRawAccount().name;
  }

  public set name(n: string | undefined) {
    this.asRawAccount().name = n;
  }

  /**
   * @property {string | undefined} verifyPublicKey
   * @desc public key for zkp verification.
   */
  public get verifyPublicKey(): Buffer | undefined {
    const raw = this.asRawAccount().verifyPublicKey;
    return raw ? toBuff(raw) : undefined;
  }

  public set verifyPublicKey(key: Buffer | undefined) {
    this.asRawAccount().verifyPublicKey = key ? toHexNoPrefix(key) : undefined;
  }

  /**
   * @property {string | undefined} encPublicKey
   * @desc public key for data asymmetric encryption.
   */
  public get encPublicKey(): Buffer | undefined {
    const raw = this.asRawAccount().encPublicKey;
    return raw ? toBuff(raw) : undefined;
  }

  public set encPublicKey(key: Buffer | undefined) {
    this.asRawAccount().encPublicKey = key ? toHexNoPrefix(key) : undefined;
  }

  /**
   * @property {string | undefined} encryptedVerifySecretKey
   * @desc encrypted secret key for zkp verification.
   * The encryption is done by symmetric encryption with the wallet password.
   */
  public get encryptedVerifySecretKey(): string | undefined {
    return this.asRawAccount().encryptedVerifySecretKey;
  }

  public set encryptedVerifySecretKey(encryptedKey: string | undefined) {
    this.asRawAccount().encryptedVerifySecretKey = encryptedKey;
  }

  /**
   * @property {string | undefined} encryptedEncSecretKey
   * @desc encrypted secret key for the asymmetric encryption.
   * The encryption is done by symmetric encryption with the wallet password.
   */
  public get encryptedEncSecretKey(): string | undefined {
    return this.asRawAccount().encryptedEncSecretKey;
  }

  public set encryptedEncSecretKey(encryptedKey: string | undefined) {
    this.asRawAccount().encryptedEncSecretKey = encryptedKey;
  }

  /**
   * @property {number | undefined} walletId
   * @desc wallet id of this account associated with.
   */
  public get walletId(): number | undefined {
    return this.asRawAccount().walletId;
  }

  public set walletId(id: number | undefined) {
    this.asRawAccount().walletId = id;
  }

  /**
   * @property {string | undefined} fullPublicKey
   * @desc full public key combined with public key for verification and public key for encryption.
   * If the {@link Account#verifyPublicKey} or {@link Account#encPublicKey} is undefined,
   * it will return undefined as value.
   */
  public get fullPublicKey(): Buffer | undefined {
    if (this.verifyPublicKey && this.encPublicKey) {
      return this.protocol.fullPublicKey(this.verifyPublicKey, this.encPublicKey);
    }
    return undefined;
  }

  /**
   * @property {string | undefined} shieldedAddress
   * @desc the shielded address calculated from {@link Account#fullPublicKey}. It will be
   * used as the receiving address in the deposit transaction.
   * If the {@link Account#verifyPublicKey} or {@link Account#encPublicKey} is undefined,
   * it will return undefined as value.
   */
  public get shieldedAddress(): string | undefined {
    if (this.verifyPublicKey && this.encPublicKey) {
      return this.protocol.shieldedAddress(this.verifyPublicKey, this.encPublicKey);
    }
    return undefined;
  }

  private asRawAccount(): RawAccount {
    return this.data as RawAccount;
  }
}
