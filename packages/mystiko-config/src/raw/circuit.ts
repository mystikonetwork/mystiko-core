import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { CircuitType } from '../common';
import { RawConfig } from './base';

export class RawCircuitConfig extends RawConfig {
  @Expose()
  @IsString()
  @IsNotEmpty()
  public name: string;

  @Expose()
  @IsEnum(CircuitType)
  public type: CircuitType;

  @Expose()
  @IsBoolean()
  public isDefault: boolean = false;

  @Expose()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  public programFile: string[];

  @Expose()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  public abiFile: string[];

  @Expose()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  public provingKeyFile: string[];

  @Expose()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  public verifyingKeyFile: string[];
}
