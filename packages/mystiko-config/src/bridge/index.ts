import { BaseBridgeConfig, RawBaseBridgeConfig } from './base';
import { BridgeType } from '../base';
import { PolyBridgeConfig } from './poly';
import { CelerBridgeConfig } from './celer';

export function createBridgeConfig(rawConfig: any): BaseBridgeConfig {
  if ((rawConfig as RawBaseBridgeConfig).type === BridgeType.POLY) {
    return new PolyBridgeConfig(rawConfig);
  }
  if ((rawConfig as RawBaseBridgeConfig).type === BridgeType.TBRIDGE) {
    return new BaseBridgeConfig(rawConfig);
  }
  if ((rawConfig as RawBaseBridgeConfig).type === BridgeType.CELER) {
    return new CelerBridgeConfig(rawConfig);
  }
  throw new Error('unsupported bridge type');
}

export * from './base';
export * from './celer';
export * from './poly';
