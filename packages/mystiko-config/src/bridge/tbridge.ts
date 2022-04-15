import { Equals } from 'class-validator';
import { BaseBridgeConfig } from './base';
import { BridgeType } from '../base';

export class TBridgeConfig extends BaseBridgeConfig {
  @Equals(BridgeType.TBRIDGE)
  public type: BridgeType = BridgeType.TBRIDGE;
}
