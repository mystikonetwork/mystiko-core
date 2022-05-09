import { RawPolyBridgeConfig } from '../../raw';
import { BridgeConfig } from './base';

export class PolyBridgeConfig extends BridgeConfig<RawPolyBridgeConfig> {
  public get explorerUrl(): string {
    return this.data.explorerUrl;
  }

  public get explorerPrefix(): string {
    return this.data.explorerPrefix;
  }

  public get apiUrl(): string {
    return this.data.apiUrl;
  }

  public get apiPrefix(): string {
    return this.data.apiPrefix;
  }

  public mutate(data?: RawPolyBridgeConfig): PolyBridgeConfig {
    return new PolyBridgeConfig(data || this.data);
  }
}
