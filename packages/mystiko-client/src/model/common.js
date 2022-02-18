import * as protocol from '../protocol';
import { deepCopy, check, isBN } from '../utils.js';

/**
 * @memberOf module:mystiko/models
 * @name module:mystiko/models.ID_KEY
 * @type {string}
 * @desc identifier for id field in Loki database.
 */
export const ID_KEY = '$loki';

/**
 * @class BaseModel
 * @param {Object | BaseModel} [data={}] raw data of this model.
 * @desc a base class for all data stored in the local database.
 */
export class BaseModel {
  constructor(data = {}) {
    if (data instanceof BaseModel) {
      this.data = deepCopy(data.data);
    } else {
      this.data = deepCopy(data);
    }
    this.protocol = protocol;
  }

  /**
   * @property {number} id the id of current data stored in database.
   * This data is only available after the data is successfully saved into Loki database.
   */
  get id() {
    return this.data[ID_KEY];
  }

  /**
   * @property {number} createdAt the creation timestamp in milliseconds.
   * If the data has not been saved yet, it will return 0.
   */
  get createdAt() {
    if (this.data['meta'] && this.data['meta']['created']) {
      return this.data['meta']['created'];
    }
    return 0;
  }

  /**
   * @property {number} updatedAt the last modification timestamp in milliseconds.
   * If the data has not been saved or modified yet, it will return 0.
   */
  get updatedAt() {
    if (this.data['meta'] && this.data['meta']['revision']) {
      return this.data['meta']['revision'];
    }
    return 0;
  }

  /**
   * @desc format this data object into JSON string.
   * @returns {string} JSON string.
   */
  toString() {
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
  static columnComparator(model1, model2, col, desc = false) {
    check(!model1 || model1 instanceof BaseModel, 'model1 should be an instance of BaseModel');
    check(!model2 || model2 instanceof BaseModel, 'model2 should be an instance of BaseModel');
    check(typeof col === 'string', 'col should be a string type');
    check(typeof desc === 'boolean', 'desc should be a boolean type');
    const col1 = model1[col];
    const col2 = model2[col];
    if (col1 && !col2) {
      return desc ? -1 : 1;
    } else if (!col1 && col2) {
      return desc ? 1 : -1;
    } else if (!col1 && !col2) {
      return 0;
    } else if (isBN(col1) && isBN(col2)) {
      if (col1.eq(col2)) {
        return 0;
      } else if (col1.gt(col2)) {
        return desc ? -1 : 1;
      } else {
        return desc ? 1 : -1;
      }
    } else {
      if (col1 === col2) {
        return 0;
      } else if (col1 > col2) {
        return desc ? -1 : 1;
      } else {
        return desc ? 1 : -1;
      }
    }
  }
}

/**
 * @typedef BridgeType
 * @name module:mystiko/models.BridgeType
 * @property {string} LOOP a loop bridge indicates no cross-chain needed.
 * The deposits and withdraws happens on the same blockchain.
 * @property {string} POLY the {@link https://poly.network Poly Bridge} cross-chain network.
 */
export const BridgeType = {
  LOOP: 'loop',
  POLY: 'poly',
  TBRIDGE: 'tbridge',
};

/**
 * @typedef AssetType
 * @name module:mystiko/models.AssetType
 * @property {string} ERC20 the {@link https://ethereum.org/en/developers/docs/standards/tokens/erc-20/ ERC20 Token}
 * standard.
 * @property {string} MAIN main asset type of the blockchains, e.g. ETH/BNB
 */
export const AssetType = {
  ERC20: 'erc20',
  MAIN: 'main',
};

/**
 * @function module:mystiko/models.isValidBridgeType
 * @desc check whether given type is one of the supported bridge types.
 * @param {string} type bridge type to be checked.
 * @returns {boolean} true if the type is supported, otherwise returns false.
 */
export function isValidBridgeType(type) {
  return Object.values(BridgeType).indexOf(type) !== -1;
}

/**
 * @function module:mystiko/models.isValidAssetType
 * @desc check whether given type is one of the supported asset types.
 * @param {string} type bridge type to be checked.
 * @returns {boolean} true if the type is supported, otherwise returns false.
 */
export function isValidAssetType(type) {
  return Object.values(AssetType).indexOf(type) !== -1;
}
