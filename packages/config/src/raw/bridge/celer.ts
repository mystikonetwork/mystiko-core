import { Equals } from 'class-validator';
import { RawBridgeConfig } from './base';
import { BridgeType } from '../../common';

/**
 * @class RawCelerBridgeConfig
 * @extends RawBridgeConfig
 * @param {Object} rawConfig raw configuration object.
 * @desc configuration class for Celer cross-chain bridge.
 */
export class RawCelerBridgeConfig extends RawBridgeConfig {
  @Equals(BridgeType.CELER)
  public type: BridgeType = BridgeType.CELER;
}
