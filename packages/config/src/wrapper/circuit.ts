import { RawCircuitConfig } from '../raw';
import { BaseConfig } from './base';
import { CircuitType } from '../common';

export class CircuitConfig extends BaseConfig<RawCircuitConfig> {
  public get name(): string {
    return this.data.name;
  }

  public get type(): CircuitType {
    return this.data.type;
  }

  public get isDefault(): boolean {
    return this.data.isDefault;
  }

  public get programFile(): string[] {
    return this.data.programFile;
  }

  public get abiFile(): string[] {
    return this.data.abiFile;
  }

  public get provingKeyFile(): string[] {
    return this.data.provingKeyFile;
  }

  public get verifyingKeyFile(): string[] {
    return this.data.verifyingKeyFile;
  }

  public mutate(data?: RawCircuitConfig): CircuitConfig {
    return new CircuitConfig(data || this.data);
  }
}
