import {
  ArrayNotEmpty,
  ArrayUnique,
  Contains,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { RawDepositContractConfig, RawPoolContractConfig } from './contract';
import { RawProviderConfig } from './provider';

export const EXPLORER_TX_PLACEHOLDER: string = '%tx%';
export const EXPLORER_DEFAULT_PREFIX: string = `/tx/${EXPLORER_TX_PLACEHOLDER}`;

export class RawChainConfig {
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
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  public explorerUrl: string;

  @Expose()
  @Contains(EXPLORER_TX_PLACEHOLDER)
  public explorerPrefix: string;

  @Expose()
  @Type(() => RawProviderConfig)
  @ValidateNested()
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  public providers: Array<RawProviderConfig> = [];

  @Expose()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  public signerEndpoint: string;

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

  @IsInt()
  @IsPositive()
  public eventFilterSize: number = 200000;
}
