import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { RawConfig } from '../base';

export class GasCost extends RawConfig {
  @Expose()
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  public transaction1x0: number;

  @Expose()
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  public transaction1x1: number;

  @Expose()
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  public transaction1x2: number;

  @Expose()
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  public transaction2x0: number;

  @Expose()
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  public transaction2x1: number;

  @Expose()
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  public transaction2x2: number;
}
