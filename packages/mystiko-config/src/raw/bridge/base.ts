import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { BridgeType } from '../../common';

export class RawBridgeConfig {
  @Expose()
  @IsString()
  @IsNotEmpty()
  public name: string;

  @Expose()
  @IsEnum(BridgeType)
  public type: BridgeType;
}
