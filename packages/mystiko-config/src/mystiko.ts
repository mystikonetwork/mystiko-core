import { IsArray, IsSemVer, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { BaseBridgeConfig, CelerBridgeConfig, PolyBridgeConfig, TBridgeConfig } from './bridge';
import { ChainConfig } from './chain';
import { CircuitConfig } from './circuit';
import { BridgeType } from './base';

export class MystikoConfig {
  @Expose()
  @IsSemVer()
  public version: string = '2.0';

  @Expose()
  @ValidateNested()
  @IsArray()
  public chains: ChainConfig[] = [];

  @Expose()
  @ValidateNested()
  @IsArray()
  @Type(() => BaseBridgeConfig, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: CelerBridgeConfig, name: BridgeType.CELER },
        { value: PolyBridgeConfig, name: BridgeType.POLY },
        { value: TBridgeConfig, name: BridgeType.TBRIDGE },
      ],
    },
  })
  public bridges: Array<BaseBridgeConfig | CelerBridgeConfig | PolyBridgeConfig> = [];

  @Expose()
  @ValidateNested()
  @IsArray()
  public circuits: CircuitConfig[] = [];
}
