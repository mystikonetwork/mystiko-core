import { RawContractConfig } from '../../raw';
import { BaseConfig } from '../base';
import { ContractType } from '../../common';

export class ContractConfig<T extends RawContractConfig> extends BaseConfig<T> {
  public get version(): number {
    return this.data.version;
  }

  public get name(): string {
    return this.data.name;
  }

  public get address(): string {
    return this.data.address;
  }

  public get type(): ContractType {
    return this.data.type;
  }

  public get startBlock(): number {
    return this.data.startBlock;
  }

  public get eventFilterSize(): number | undefined {
    return this.data.eventFilterSize;
  }
}