import { check } from '@mystikonetwork/utils';
import { BaseModel } from './common';
import { isValidVersion } from '../version';

export interface RawWallet {
  encryptedMasterSeed?: string;
  hashedPassword?: string;
  accountNonce?: number;
  version?: string;
}

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
   * @property {string | undefined} encryptedMasterSeed
   * @desc encrypted master seed of this wallet.
   */
  public get encryptedMasterSeed(): string | undefined {
    return this.asRawWallet().encryptedMasterSeed;
  }

  public set encryptedMasterSeed(encSeed: string | undefined) {
    this.asRawWallet().encryptedMasterSeed = encSeed;
  }

  /**
   * @property {string | undefined} hashedPassword
   * @desc hashed password of this wallet.
   */
  public get hashedPassword(): string | undefined {
    return this.asRawWallet().hashedPassword;
  }

  public set hashedPassword(hashedPass: string | undefined) {
    this.asRawWallet().hashedPassword = hashedPass;
  }

  /**
   * @property {number | undefined} accountNonce
   * @desc nonce for account creation. This field is used store the number of account
   * which this wallet has created.
   */
  public get accountNonce(): number | undefined {
    return this.asRawWallet().accountNonce;
  }

  public set accountNonce(nonce: number | undefined) {
    this.asRawWallet().accountNonce = nonce;
  }

  /**
   * @property {string | undefined} version
   * @desc version string of this wallet instance.
   */
  public get version(): string | undefined {
    return this.asRawWallet().version;
  }

  public set version(v) {
    check(!v || isValidVersion(v), `${v} is an invalid version string`);
    this.asRawWallet().version = v;
  }

  private asRawWallet(): RawWallet {
    return this.data as RawWallet;
  }
}
