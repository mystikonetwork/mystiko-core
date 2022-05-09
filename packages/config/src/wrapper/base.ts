import { instanceToPlain, instanceToInstance } from 'class-transformer';
import { RawConfig } from '../raw';

export class BaseConfig<R extends RawConfig, A = {}> {
  protected readonly data: R;

  protected readonly auxData?: A;

  constructor(data: R, auxData?: A) {
    this.data = data;
    this.auxData = auxData;
  }

  public copyData(): R {
    return instanceToInstance(this.data);
  }

  public toJsonString(): string {
    return JSON.stringify(instanceToPlain(this.data));
  }

  public mutate(data?: R, auxData?: A): BaseConfig<R, A> {
    return new BaseConfig<R, A>(data || this.data, auxData || this.auxData);
  }

  protected get auxDataNotEmpty(): A {
    if (!this.auxData) {
      throw new Error('auxData has not been specified');
    }
    return this.auxData;
  }
}
