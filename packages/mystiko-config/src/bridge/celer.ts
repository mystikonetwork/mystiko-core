import { BaseBridgeConfig, RawBaseBridgeConfig } from './base';

export interface RawCelerBridgeConfig extends RawBaseBridgeConfig {}

/**
 * @class CelerBridgeConfig
 * @extends BaseBridgeConfig
 * @param {Object} rawConfig raw configuration object.
 * @desc configuration class for Celer cross-chain bridge.
 */
export class CelerBridgeConfig extends BaseBridgeConfig {}
