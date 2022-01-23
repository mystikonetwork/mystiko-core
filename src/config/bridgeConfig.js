import { BaseConfig } from './common.js';
import { EXPLORER_TX_PLACEHOLDER } from './chainConfig.js';
import { check, toHexNoPrefix } from '../utils.js';
import { BridgeType, isValidBridgeType } from '../model';

/**
 * @class BaseBridgeConfig
 * @extends BaseConfig
 * @param {Object} rawConfig raw configuration object.
 * @desc base class of cross-chain bridge's configuration.
 */
export class BaseBridgeConfig extends BaseConfig {
  constructor(rawConfig) {
    super(rawConfig);
    BaseConfig.checkString(this.config, 'name');
    BaseConfig.checkString(this.config, 'type');
    check(isValidBridgeType(this.config['type']), 'invalid bridge type');
  }

  /**
   * @property {string} name
   * @desc the name of the configured cross-chain bridge.
   */
  get name() {
    return this.config['name'];
  }

  /**
   * @property {module:mystiko/models.BridgeType} type
   * @desc the type of the configured cross-chain bridge.
   */
  get type() {
    return this.config['type'];
  }

  /**
   * @desc create cross-chain bridge with given raw configuration object.
   * @param {Object} rawConfig the raw configuration object.
   * @returns {BaseBridgeConfig} the wrapped configuration object.
   */
  static createConfig(rawConfig) {
    if (rawConfig['type'] === BridgeType.POLY) {
      return new PolyBridgeConfig(rawConfig);
    }
    throw new Error('unsupported bridge type');
  }
}

/**
 * @class PolyBridgeConfig
 * @extends BaseBridgeConfig
 * @param {Object} rawConfig raw configuration object.
 * @desc configuration class for Poly cross-chain bridge.
 */
export class PolyBridgeConfig extends BaseBridgeConfig {
  constructor(rawConfig) {
    super(rawConfig);
    BaseConfig.checkString(this.config, 'explorerUrl');
    BaseConfig.checkString(this.config, 'explorerPrefix');
    check(this.config['explorerPrefix'].indexOf(EXPLORER_TX_PLACEHOLDER) !== -1, 'invalid prefix template');
    BaseConfig.checkString(this.config, 'apiUrl');
    BaseConfig.checkString(this.config, 'apiPrefix');
    check(this.config['apiPrefix'].indexOf(EXPLORER_TX_PLACEHOLDER) !== -1, 'invalid prefix template');
  }

  /**
   * @property {string} explorerUrl
   * @desc the base explorer URL of the configured cross-chain bridge.
   */
  get explorerUrl() {
    return this.config['explorerUrl'];
  }

  /**
   * @property {string} explorerPrefix
   * @desc the explorer's transaction URI template of the configured cross-chain bridge.
   */
  get explorerPrefix() {
    return this.config['explorerPrefix'];
  }

  /**
   * @desc get the full explorer URL of given transaction hash.
   * @param {string} txHash hash of the querying transaction.
   * @returns {string} a full URL.
   */
  getTxUrl(txHash) {
    check(typeof txHash === 'string', 'txHash should be a valid string');
    return `${this.explorerUrl}${this.explorerPrefix.replace(
      EXPLORER_TX_PLACEHOLDER,
      toHexNoPrefix(txHash),
    )}`;
  }

  /**
   * @property {string} apiUrl
   * @desc the base explorer API URL of the configured cross-chain bridge.
   */
  get apiUrl() {
    return this.config['apiUrl'];
  }

  /**
   * @property {string} apiPrefix
   * @desc the explorer's API transaction URI template of the configured cross-chain bridge.
   */
  get apiPrefix() {
    return this.config['apiPrefix'];
  }

  /**
   * @desc get the full explorer API URL of given transaction hash.
   * @param {string} txHash hash of the querying transaction.
   * @returns {string} a full API URL.
   */
  getFullApiUrl(txHash) {
    check(typeof txHash === 'string', 'txHash should be a valid string');
    return `${this.apiUrl}${this.apiPrefix.replace(EXPLORER_TX_PLACEHOLDER, toHexNoPrefix(txHash))}`;
  }
}
