import {
  IsEnum,
  IsEthereumAddress,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Expose } from 'class-transformer';
import { ContractType } from '../base';

export class BaseContractConfig {
  @Expose()
  @IsInt()
  @IsPositive()
  public version: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  public name: string;

  @Expose()
  @IsEthereumAddress()
  public address: string;

  @IsEnum(ContractType)
  public type: ContractType;

  @Expose()
  @IsInt()
  @IsPositive()
  public startBlock: number;

  @Expose()
  @IsInt()
  @IsPositive()
  @IsOptional()
  public eventFilterSize?: number;
}
