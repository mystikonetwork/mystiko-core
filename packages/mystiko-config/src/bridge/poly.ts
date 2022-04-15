import { Contains, Equals, IsUrl } from 'class-validator';
import { Expose } from 'class-transformer';
import { BaseBridgeConfig } from './base';
import { EXPLORER_DEFAULT_PREFIX, EXPLORER_TX_PLACEHOLDER } from '../chain';
import { BridgeType } from '../base';

export class PolyBridgeConfig extends BaseBridgeConfig {
  @Equals(BridgeType.POLY)
  public type: BridgeType = BridgeType.POLY;

  @Expose()
  @IsUrl()
  public explorerUrl: string;

  @Expose()
  @Contains(EXPLORER_TX_PLACEHOLDER)
  public explorerPrefix: string = EXPLORER_DEFAULT_PREFIX;

  @Expose()
  @IsUrl()
  public apiUrl: string;

  @Expose()
  @Contains(EXPLORER_TX_PLACEHOLDER)
  public apiPrefix: string;
}
