import { ArrayUnique, IsArray, IsSemVer, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { RawBridgeConfig, RawCelerBridgeConfig, RawPolyBridgeConfig, RawTBridgeConfig } from './bridge';
import { RawChainConfig } from './chain';
import { RawCircuitConfig } from './circuit';
import { BridgeType } from '../common';
import { RawConfig } from './base';

export type RawBridgeConfigType = RawCelerBridgeConfig | RawPolyBridgeConfig | RawTBridgeConfig;

export class RawMystikoConfig extends RawConfig {
  @Expose()
  @IsSemVer()
  public version: string = '0.1.0';

  @Expose()
  @Type(() => RawChainConfig)
  @ValidateNested()
  @IsArray()
  @ArrayUnique((conf) => conf.chainId)
  public chains: RawChainConfig[] = [];

  @Expose()
  @ValidateNested()
  @IsArray()
  @ArrayUnique((conf) => conf.type)
  @Type(() => RawBridgeConfig, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: RawCelerBridgeConfig, name: BridgeType.CELER },
        { value: RawPolyBridgeConfig, name: BridgeType.POLY },
        { value: RawTBridgeConfig, name: BridgeType.TBRIDGE },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  public bridges: Array<RawBridgeConfigType> = [];

  @Expose()
  @Type(() => RawCircuitConfig)
  @ValidateNested()
  @IsArray()
  @ArrayUnique((conf) => conf.name)
  public circuits: RawCircuitConfig[] = [];
}
