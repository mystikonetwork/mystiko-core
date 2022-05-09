import { BaseConfig } from './base';
import { RawProviderConfig } from '../raw';

export class ProviderConfig extends BaseConfig<RawProviderConfig> {
  public get url(): string {
    return this.data.url;
  }

  public get timeoutMs(): number {
    return this.data.timeoutMs;
  }

  public get maxTryCount(): number {
    return this.data.maxTryCount;
  }

  public mutate(data?: RawProviderConfig): ProviderConfig {
    return new ProviderConfig(data || this.data);
  }
}
