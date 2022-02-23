import { check } from '@mystiko/utils';
import { BaseConfig, BridgeType } from '../base';

export interface RawBaseBridgeConfig {
  name: string;
  type: BridgeType;
}

/**
 * @class BaseBridgeConfig
 * @extends BaseConfig
 * @param {any} rawConfig raw configuration object.
 * @desc base class of cross-chain bridge's configuration.
 */
export class BaseBridgeConfig extends BaseConfig {
  constructor(rawConfig: any) {
    super(rawConfig);
    BaseConfig.checkString(this.config, 'name');
    BaseConfig.checkString(this.config, 'type');
    check(Object.values(BridgeType).includes(this.type), `${this.type} is an invalid BridgetType`);
  }

  /**
   * @property {string} name
   * @desc the name of the configured cross-chain bridge.
   */
  public get name(): string {
    return this.asRawBaseBridgeConfig().name;
  }

  /**
   * @property {BridgeType} type
   * @desc the type of the configured cross-chain bridge.
   */
  public get type(): BridgeType {
    return this.asRawBaseBridgeConfig().type;
  }

  protected asRawBaseBridgeConfig(): RawBaseBridgeConfig {
    return this.config as RawBaseBridgeConfig;
  }
}
