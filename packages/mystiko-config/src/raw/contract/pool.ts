import {
  ArrayUnique,
  Equals,
  IsArray,
  IsEnum,
  IsEthereumAddress,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Expose } from 'class-transformer';
import { RawContractConfig } from './base';
import { AssetType, ContractType } from '../../common';

export class RawPoolContractConfig extends RawContractConfig {
  @Expose()
  @Equals(ContractType.POOL)
  public type: ContractType = ContractType.POOL;

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
  @IsOptional()
  @IsEthereumAddress()
  public assetAddress?: string;

  @Expose()
  @IsArray()
  @ArrayUnique()
  @IsNumberString({ no_symbols: true }, { each: true })
  public recommendedAmounts: string[] = [];

  @Expose()
  @IsNumberString({ no_symbols: true })
  public minRollupFee: string = '0';

  @Expose()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  public circuits: string[] = [];
}
