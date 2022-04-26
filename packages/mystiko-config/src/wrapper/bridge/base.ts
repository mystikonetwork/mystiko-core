import { RawBridgeConfig } from '../../raw';
import { BaseConfig } from '../base';
import { BridgeType } from '../../common';

export class BridgeConfig<T extends RawBridgeConfig> extends BaseConfig<T> {
  public get name(): string {
    return this.data.name;
  }

  public get type(): BridgeType {
    return this.data.type;
  }
}
