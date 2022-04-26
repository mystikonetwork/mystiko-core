import { Contains, Equals, IsUrl } from 'class-validator';
import { Expose } from 'class-transformer';
import { RawBridgeConfig } from './base';
import { EXPLORER_DEFAULT_PREFIX, EXPLORER_TX_PLACEHOLDER } from '../chain';
import { BridgeType } from '../../common';

export class RawPolyBridgeConfig extends RawBridgeConfig {
  @Equals(BridgeType.POLY)
  public type: BridgeType = BridgeType.POLY;

  @Expose()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  public explorerUrl: string;

  @Expose()
  @Contains(EXPLORER_TX_PLACEHOLDER)
  public explorerPrefix: string = EXPLORER_DEFAULT_PREFIX;

  @Expose()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  public apiUrl: string;

  @Expose()
  @Contains(EXPLORER_TX_PLACEHOLDER)
  public apiPrefix: string;
}
