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
import { BaseContractConfig } from './base';
import { ContractType } from '../base';

export class PoolContractConfig extends BaseContractConfig {
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
  @IsNotEmpty({ each: true })
  public circuits: string[];
}
