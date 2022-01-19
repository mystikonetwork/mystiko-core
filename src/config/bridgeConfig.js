import { BaseConfig } from './common.js';
import { EXPLORER_TX_PLACEHOLDER } from './chainConfig.js';
import { check, toHexNoPrefix } from '../utils.js';
import { isValidBridgeType, BridgeType } from './contractConfig.js';

export class BaseBridgeConfig extends BaseConfig {
  constructor(rawConfig) {
    super(rawConfig);
    BaseConfig.checkString(this.config, 'name');
    BaseConfig.checkString(this.config, 'type');
    check(isValidBridgeType(this.config['type']), 'invalid bridge type');
  }

  get name() {
    return this.config['name'];
  }

  get type() {
    return this.config['type'];
  }

  static createConfig(rawConfig) {
    if (rawConfig['type'] === BridgeType.POLY) {
      return new PolyBridgeConfig(rawConfig);
    }
    throw new Error('unsupported bridge type');
  }
}

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

  get explorerUrl() {
    return this.config['explorerUrl'];
  }

  get explorerPrefix() {
    return this.config['explorerPrefix'];
  }

  getTxUrl(txHash) {
    check(typeof txHash === 'string', 'txHash should be a valid string');
    return `${this.explorerUrl}${this.explorerPrefix.replace(
      EXPLORER_TX_PLACEHOLDER,
      toHexNoPrefix(txHash),
    )}`;
  }

  get apiUrl() {
    return this.config['apiUrl'];
  }

  get apiPrefix() {
    return this.config['apiPrefix'];
  }

  getFullApiUrl(txHash) {
    check(typeof txHash === 'string', 'txHash should be a valid string');
    return `${this.apiUrl}${this.apiPrefix.replace(EXPLORER_TX_PLACEHOLDER, toHexNoPrefix(txHash))}`;
  }
}
