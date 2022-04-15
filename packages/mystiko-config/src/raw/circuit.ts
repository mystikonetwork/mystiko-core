import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { CircuitType } from '../common';

export class RawCircuitConfig {
  @Expose()
  @IsString()
  @IsNotEmpty()
  public name: string;

  @Expose()
  @IsEnum(CircuitType)
  public type: CircuitType;

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
