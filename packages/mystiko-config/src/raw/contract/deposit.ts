import {
  Equals,
  IsArray,
  IsBoolean,
  IsEnum,
  IsEthereumAddress,
  IsNumberString,
  ValidateNested,
} from 'class-validator';
import { Expose } from 'class-transformer';
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
  @ValidateNested()
  @IsArray()
  public peerChains: RawPeerContractConfig[] = [];

  @Expose()
  @IsNumberString()
  public minAmount: string = '0';

  @Expose()
  @IsNumberString()
  public minBridgeFee: string = '0';

  @Expose()
  @IsNumberString()
  public minExecutorFee: string = '0';
}
