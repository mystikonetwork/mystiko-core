import { BridgeConfig } from './base';
import { RawCelerBridgeConfig } from '../../raw';

export class CelerBridgeConfig extends BridgeConfig<RawCelerBridgeConfig> {
  public mutate(data?: RawCelerBridgeConfig): CelerBridgeConfig {
    return new CelerBridgeConfig(data || this.data);
  }
}
