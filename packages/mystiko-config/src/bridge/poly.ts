import { check, toHexNoPrefix } from '@mystikonetwork/utils';
import { BaseBridgeConfig, RawBaseBridgeConfig } from './base';
import { BaseConfig } from '../base';
import { EXPLORER_TX_PLACEHOLDER } from '../chain';

export interface RawPolyBridgeConfig extends RawBaseBridgeConfig {
  explorerUrl: string;
  explorerPrefix: string;
  apiUrl: string;
  apiPrefix: string;
}

/**
 * @class PolyBridgeConfig
 * @extends BaseBridgeConfig
 * @param {any} rawConfig raw configuration object.
 * @desc configuration class for Poly cross-chain bridge.
 */
export class PolyBridgeConfig extends BaseBridgeConfig {
  constructor(rawConfig: any) {
    super(rawConfig);
    BaseConfig.checkString(this.config, 'explorerUrl');
    BaseConfig.checkString(this.config, 'explorerPrefix');
    check(this.explorerPrefix.indexOf(EXPLORER_TX_PLACEHOLDER) !== -1, 'invalid prefix template');
    BaseConfig.checkString(this.config, 'apiUrl');
    BaseConfig.checkString(this.config, 'apiPrefix');
    check(this.apiPrefix.indexOf(EXPLORER_TX_PLACEHOLDER) !== -1, 'invalid prefix template');
  }

  /**
   * @property {string} explorerUrl
   * @desc the base explorer URL of the configured cross-chain bridge.
   */
  public get explorerUrl(): string {
    return this.asRawPolyBridgeConfig().explorerUrl;
  }

  /**
   * @property {string} explorerPrefix
   * @desc the explorer's transaction URI template of the configured cross-chain bridge.
   */
  public get explorerPrefix(): string {
    return this.asRawPolyBridgeConfig().explorerPrefix;
  }

  /**
   * @desc get the full explorer URL of given transaction hash.
   * @param {string} txHash hash of the querying transaction.
   * @returns {string} a full URL.
   */
  public getTxUrl(txHash: string): string {
    return `${this.explorerUrl}${this.explorerPrefix.replace(
      EXPLORER_TX_PLACEHOLDER,
      toHexNoPrefix(txHash),
    )}`;
  }

  /**
   * @property {string} apiUrl
   * @desc the base explorer API URL of the configured cross-chain bridge.
   */
  public get apiUrl(): string {
    return this.asRawPolyBridgeConfig().apiUrl;
  }

  /**
   * @property {string} apiPrefix
   * @desc the explorer's API transaction URI template of the configured cross-chain bridge.
   */
  public get apiPrefix(): string {
    return this.asRawPolyBridgeConfig().apiPrefix;
  }

  /**
   * @desc get the full explorer API URL of given transaction hash.
   * @param {string} txHash hash of the querying transaction.
   * @returns {string} a full API URL.
   */
  public getFullApiUrl(txHash: string): string {
    return `${this.apiUrl}${this.apiPrefix.replace(EXPLORER_TX_PLACEHOLDER, toHexNoPrefix(txHash))}`;
  }

  private asRawPolyBridgeConfig(): RawPolyBridgeConfig {
    return this.config as RawPolyBridgeConfig;
  }
}
