import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { RawConfig } from '../base';
import { GasCost } from './gascost';

export class TransactionConfig extends RawConfig {
  @Expose()
  @Type(() => GasCost)
  @ValidateNested()
  public mainGasCost: GasCost;

  @Expose()
  @Type(() => GasCost)
  @ValidateNested()
  public erc20GasCost: GasCost;
}
