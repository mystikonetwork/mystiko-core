import { deepCopy, isBN } from '@mystikonetwork/utils';
import { MystikoProtocolV1 } from '@mystikonetwork/protocol';

/**
 * @memberOf module:mystiko/models
 * @name module:mystiko/models.ID_KEY
 * @type {string}
 * @desc identifier for id field in Loki database.
 */
export const ID_KEY: string = '$loki';

export interface RawBaseModel {
  $loki?: number;
  meta?: { created?: number; revision?: number };
}

/**
 * @class BaseModel
 * @param {Object | BaseModel} [data={}] raw data of this model.
 * @desc a base class for all data stored in the local database.
 */
export class BaseModel {
  public readonly data: Object;

  protected readonly protocol: MystikoProtocolV1;

  constructor(data: Object = {}) {
    if (data instanceof BaseModel) {
      this.data = deepCopy((data as BaseModel).data);
    } else {
      this.data = deepCopy(data);
    }
    this.protocol = new MystikoProtocolV1();
  }

  /**
   * @property {number | undefined} id the id of current data stored in database.
   * This data is only available after the data is successfully saved into Loki database.
   */
  public get id(): number | undefined {
    return this.asRawBaseModel().$loki;
  }

  /**
   * @property {number} createdAt the creation timestamp in milliseconds.
   * If the data has not been saved yet, it will return 0.
   */
  public get createdAt(): number {
    const rawData = this.asRawBaseModel();
    if (rawData.meta && rawData.meta.created) {
      return rawData.meta.created;
    }
    return 0;
  }

  /**
   * @property {number} updatedAt the last modification timestamp in milliseconds.
   * If the data has not been saved or modified yet, it will return 0.
   */
  get updatedAt() {
    const rawData = this.asRawBaseModel();
    if (rawData.meta && rawData.meta.revision) {
      return rawData.meta.revision;
    }
    return 0;
  }

  /**
   * @desc format this data object into JSON string.
   * @returns {string} JSON string.
   */
  public toString(): string {
    return JSON.stringify(this.data);
  }

  /**
   * @desc compare two models with given column name and sorting direction.
   * @param {BaseModel | undefined} model1 first model to be compared.
   * @param {BaseModel | undefined} model2 second model to be compared.
   * @param {string} col name of the column being sorted by.
   * @param {boolean} [desc=false] sorting direction, if true, sort with descending order. Otherwise,
   * sort with ascending order.
   * @returns {number} 0 indicates the two models' given column is equal, 1 indicates first should be ahead of second,
   * -1 indicates second should be ahead of first.
   */
  static columnComparator(model1: BaseModel, model2: BaseModel, col: string, desc: boolean = false): number {
    const col1 = (model1 as { [key: string]: any })[col];
    const col2 = (model2 as { [key: string]: any })[col];
    if (col1 && !col2) {
      return desc ? -1 : 1;
    }
    if (!col1 && col2) {
      return desc ? 1 : -1;
    }
    if (!col1 && !col2) {
      return 0;
    }
    if (isBN(col1) && isBN(col2)) {
      if (col1.eq(col2)) {
        return 0;
      }
      if (col1.gt(col2)) {
        return desc ? -1 : 1;
      }
      return desc ? 1 : -1;
    }
    if (col1 === col2) {
      return 0;
    }
    if (col1 > col2) {
      return desc ? -1 : 1;
    }
    return desc ? 1 : -1;
  }

  private asRawBaseModel(): RawBaseModel {
    return this.data as RawBaseModel;
  }
}
