import { RawBridgeConfig } from '../../raw';
import { BaseConfig } from '../base';
import { BridgeType } from '../../common';

export class BridgeConfig<T extends RawBridgeConfig, A = {}> extends BaseConfig<T, A> {
  public get name(): string {
    return this.data.name;
  }

  public get type(): BridgeType {
    return this.data.type;
  }

  public mutate(data?: T, auxData?: A): BridgeConfig<T, A> {
    return new BridgeConfig<T, A>(data || this.data, auxData || this.auxData);
  }
}
