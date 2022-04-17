import { ArrayUnique, IsArray, IsSemVer, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { RawBridgeConfig, RawCelerBridgeConfig, RawPolyBridgeConfig, RawTBridgeConfig } from './bridge';
import { RawChainConfig } from './chain';
import { RawCircuitConfig } from './circuit';
import { BridgeType } from '../common';

export type RawBridgeConfigType = RawCelerBridgeConfig | RawPolyBridgeConfig | RawTBridgeConfig;

export class RawMystikoConfig {
  @Expose()
  @IsSemVer()
  public version: string = '2.0';

  @Expose()
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
  })
  public bridges: Array<RawBridgeConfigType> = [];

  @Expose()
  @ValidateNested()
  @IsArray()
  @ArrayUnique((conf) => conf.name)
  public circuits: RawCircuitConfig[] = [];
}
