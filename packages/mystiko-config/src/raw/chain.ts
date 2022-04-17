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
import { ProviderConnection } from '@mystikonetwork/utils';
import { RawDepositContractConfig, RawPoolContractConfig } from './contract';

export const EXPLORER_TX_PLACEHOLDER: string = '%tx%';
export const EXPLORER_DEFAULT_PREFIX: string = `/tx/${EXPLORER_TX_PLACEHOLDER}`;

export class RawChainConfig {
  @IsInt()
  @IsPositive()
  public chainId: number;

  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsNotEmpty()
  public assetSymbol: string;

  @IsInt()
  @IsPositive()
  public assetDecimals: number = 18;

  @IsUrl()
  public explorerUrl: string;

  @Contains(EXPLORER_TX_PLACEHOLDER)
  public explorerPrefix: string;

  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  public providers: Array<string | ProviderConnection> = [];

  @IsUrl()
  public signerEndpoint: string;

  @ValidateNested()
  @IsArray()
  @ArrayUnique((conf) => conf.address)
  public depositContracts: RawDepositContractConfig[] = [];

  @ValidateNested()
  @IsArray()
  @ArrayUnique((conf) => conf.address)
  public poolContracts: RawPoolContractConfig[] = [];

  @IsInt()
  @IsPositive()
  public eventFilterSize: number = 200000;
}
