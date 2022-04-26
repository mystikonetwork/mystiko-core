import {
  ArrayNotEmpty,
  ArrayUnique,
  Contains,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { RawAssetConfig } from './asset';
import { RawDepositContractConfig, RawPoolContractConfig } from './contract';
import { RawProviderConfig } from './provider';
import { RawConfig } from './base';

export const EXPLORER_TX_PLACEHOLDER: string = '%tx%';
export const EXPLORER_DEFAULT_PREFIX: string = `/tx/${EXPLORER_TX_PLACEHOLDER}`;

export class RawChainConfig extends RawConfig {
  @Expose()
  @IsInt()
  @IsPositive()
  public chainId: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  public name: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  public assetSymbol: string;

  @Expose()
  @IsInt()
  @IsPositive()
  public assetDecimals: number = 18;

  @Expose()
  @IsArray()
  @ArrayUnique()
  @IsNumberString({ no_symbols: true }, { each: true })
  public recommendedAmounts: string[] = [];

  @Expose()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  public explorerUrl: string;

  @Expose()
  @Contains(EXPLORER_TX_PLACEHOLDER)
  public explorerPrefix: string = EXPLORER_DEFAULT_PREFIX;

  @Expose()
  @Type(() => RawProviderConfig)
  @ValidateNested()
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  public providers: Array<RawProviderConfig> = [];

  @Expose()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  public signerEndpoint: string;

  @IsInt()
  @IsPositive()
  public eventFilterSize: number = 200000;

  @Expose()
  @Type(() => RawDepositContractConfig)
  @ValidateNested()
  @IsArray()
  @ArrayUnique((conf) => conf.address)
  public depositContracts: RawDepositContractConfig[] = [];

  @Expose()
  @Type(() => RawPoolContractConfig)
  @ValidateNested()
  @IsArray()
  @ArrayUnique((conf) => conf.address)
  public poolContracts: RawPoolContractConfig[] = [];

  @Expose()
  @Type(() => RawAssetConfig)
  @ValidateNested()
  @IsArray()
  @ArrayUnique((conf) => conf.assetAddress)
  public assets: RawAssetConfig[] = [];
}
