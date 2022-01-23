import * as protocol from '../protocol';

/**
 * @memberOf module:mystiko/models
 * @name module:mystiko/models.ID_KEY
 * @type {string}
 * @desc identifier for id field in Loki database.
 */
export const ID_KEY = '$loki';

/**
 * @class BaseModel
 * @param {Object} [data={}] raw data of this model.
 * @desc a base class for all data stored in the local database.
 */
export class BaseModel {
  constructor(data = {}) {
    this.data = data;
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
