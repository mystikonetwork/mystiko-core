import {
  Equals,
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
import { ContractType } from '../../common';

export class RawPoolContractConfig extends RawContractConfig {
  @Expose()
  @Equals(ContractType.POOL)
  public type: ContractType = ContractType.POOL;

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
  @IsNumberString()
  public minRollupFee: string = '0';

  @Expose()
  @IsString({ each: true })
  public circuits: string[] = [];
}
