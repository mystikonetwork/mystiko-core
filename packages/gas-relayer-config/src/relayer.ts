import { Expose, Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsSemVer, ValidateNested } from 'class-validator';
import { RawConfig, RawChainConfig } from './raw';

export class RawRelayerConfig extends RawConfig {
  @Expose()
  @IsSemVer()
  public version: string = '0.0.1';

  @Expose()
  @Type(() => RawChainConfig)
  @ValidateNested()
  @IsArray()
  @ArrayUnique((conf) => conf.chainId)
  public chains: RawChainConfig[] = [];
}
