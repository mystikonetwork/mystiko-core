import { Equals } from 'class-validator';
import { BaseBridgeConfig } from './base';
import { BridgeType } from '../base';

/**
 * @class CelerBridgeConfig
 * @extends BaseBridgeConfig
 * @param {Object} rawConfig raw configuration object.
 * @desc configuration class for Celer cross-chain bridge.
 */
export class CelerBridgeConfig extends BaseBridgeConfig {
  @Equals(BridgeType.CELER)
  public type: BridgeType = BridgeType.CELER;
}
