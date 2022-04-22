import { Expose } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsEthereumAddress,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsPositive,
  IsString,
} from 'class-validator';
import { AssetType } from '../common';
import { RawConfig } from './base';

export class RawAssetConfig extends RawConfig {
  @Expose()
  @IsEnum(AssetType)
  public assetType: AssetType;

  @Expose()
  @IsString()
  @IsNotEmpty()
  public assetSymbol: string;

  @Expose()
  @IsInt()
  @IsPositive()
  public assetDecimals: number = 18;

  @Expose()
  @IsEthereumAddress()
  public assetAddress: string;

  @Expose()
  @IsArray()
  @ArrayUnique()
  @IsNumberString({ no_symbols: true }, { each: true })
  public recommendedAmounts: string[] = [];
}
