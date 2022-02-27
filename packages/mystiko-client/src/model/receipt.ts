import { BaseModel } from './common';

export interface RawDepositReceipt {
  chainId?: number;
  transactionHash?: string;
}

/**
 * @class DepositReceipt
 * @extends BaseModel
 * @param {Object} [data={}] raw data of the Account model.
 * @desc data model for storing off-chain receipt of deposit.
 */
export class DepositReceipt extends BaseModel {
  constructor(data: Object = {}) {
    super(data);
  }

  /**
   * @property {number | undefined} chainId
   * @desc the chain id where this off-chain note is created from.
   */
  public get chainId(): number | undefined {
    return this.asRawDepositReceipt().chainId;
  }

  public set chainId(id: number | undefined) {
    this.asRawDepositReceipt().chainId = id;
  }

  /**
   * @property {string | undefined} transactionHash
   * @desc the transaction hash where this off-chain deposit receipt is created from.
   */
  public get transactionHash(): string | undefined {
    return this.asRawDepositReceipt().transactionHash;
  }

  public set transactionHash(hash: string | undefined) {
    this.asRawDepositReceipt().transactionHash = hash;
  }

  private asRawDepositReceipt(): RawDepositReceipt {
    return this.data as RawDepositReceipt;
  }
}
