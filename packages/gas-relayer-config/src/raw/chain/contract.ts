import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumberString, IsString } from 'class-validator';
import { RawConfig } from '../base';

export class RawContractConfig extends RawConfig {
  @Expose()
  @IsString()
  @IsNotEmpty()
  public assetSymbol: string;

  @Expose()
  @IsInt()
  @IsNotEmpty()
  public relayerFeeOfTenThousandth: number;

  @Expose()
  @IsNumberString({ no_symbols: true })
  public minimumGasFee: string = '0';
}
