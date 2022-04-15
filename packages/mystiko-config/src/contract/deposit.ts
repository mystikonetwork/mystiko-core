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
import { BaseContractConfig } from './base';
import { BridgeType, ContractType } from '../base';
import { PeerContractConfig } from './peer';

export class DepositContractConfig extends BaseContractConfig {
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
  public peerChains: PeerContractConfig[] = [];

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
