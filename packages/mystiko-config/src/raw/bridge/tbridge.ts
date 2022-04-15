import { Equals } from 'class-validator';
import { RawBridgeConfig } from './base';
import { BridgeType } from '../../common';

export class RawTBridgeConfig extends RawBridgeConfig {
  @Equals(BridgeType.TBRIDGE)
  public type: BridgeType = BridgeType.TBRIDGE;
}
