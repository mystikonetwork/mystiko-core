import { BridgeConfig } from './base';
import { RawTBridgeConfig } from '../../raw';

export class TBridgeConfig extends BridgeConfig<RawTBridgeConfig> {
  public mutate(data?: RawTBridgeConfig): TBridgeConfig {
    return new TBridgeConfig(data || this.data);
  }
}
