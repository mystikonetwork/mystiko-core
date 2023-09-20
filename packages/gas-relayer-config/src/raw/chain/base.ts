import { IsEthereumAddress, IsInt, IsNotEmpty, IsPositive, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { RawConfig } from '../base';
import { RawContractConfig } from './contract';
import { TransactionConfig } from './transaction';

export class RawChainConfig extends RawConfig {
  @Expose()
  @IsString()
  @IsNotEmpty()
  public name: string;

  @Expose()
  @IsInt()
  @IsPositive()
  public chainId: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  public assetSymbol: string;

  @Expose()
  @IsEthereumAddress()
  public relayerContractAddress: string;

  @Expose()
  @Type(() => RawContractConfig)
  @ValidateNested()
  public contracts: Array<RawContractConfig> = [];

  @Expose()
  @Type(() => TransactionConfig)
  @ValidateNested()
  public transactionInfo: TransactionConfig;
}
