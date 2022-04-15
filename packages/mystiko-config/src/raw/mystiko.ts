import { IsArray, IsSemVer, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { RawBridgeConfig, RawCelerBridgeConfig, RawPolyBridgeConfig, RawTBridgeConfig } from './bridge';
import { RawChainConfig } from './chain';
import { RawCircuitConfig } from './circuit';
import { BridgeType } from '../common';

export class RawMystikoConfig {
  @Expose()
  @IsSemVer()
  public version: string = '2.0';

  @Expose()
  @ValidateNested()
  @IsArray()
  public chains: RawChainConfig[] = [];

  @Expose()
  @ValidateNested()
  @IsArray()
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
  public bridges: Array<RawBridgeConfig | RawCelerBridgeConfig | RawPolyBridgeConfig> = [];

  @Expose()
  @ValidateNested()
  @IsArray()
  public circuits: RawCircuitConfig[] = [];
}
