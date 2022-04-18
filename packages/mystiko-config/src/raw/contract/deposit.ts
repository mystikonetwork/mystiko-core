import {
  ArrayUnique,
  Equals,
  IsArray,
  IsBoolean,
  IsEnum,
  IsEthereumAddress,
  IsNumberString,
  ValidateNested,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { RawContractConfig } from './base';
import { BridgeType, ContractType } from '../../common';
import { RawPeerContractConfig } from './peer';

export class RawDepositContractConfig extends RawContractConfig {
  @Expose()
  @Equals(ContractType.DEPOSIT)
  public type: ContractType = ContractType.DEPOSIT;

  @Expose()
  @IsEnum(BridgeType)
  public bridgeType: BridgeType;

  @Expose()
  @IsEthereumAddress()
  public poolAddress: string;

  @Expose()
  @IsBoolean()
  public disabled: boolean = false;

  @Expose()
  @Type(() => RawPeerContractConfig)
  @ValidateNested()
  @IsArray()
  @ArrayUnique((conf) => `${conf.chainId}/${conf.address}`)
  public peerChains: RawPeerContractConfig[] = [];

  @Expose()
  @IsNumberString({ no_symbols: true })
  public minAmount: string = '0';

  @Expose()
  @IsNumberString({ no_symbols: true })
  public minBridgeFee: string = '0';

  @Expose()
  @IsNumberString({ no_symbols: true })
  public minExecutorFee: string = '0';
}
