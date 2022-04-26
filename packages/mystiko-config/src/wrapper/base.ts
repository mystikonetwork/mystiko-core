import { instanceToPlain, instanceToInstance } from 'class-transformer';

export class BaseConfig<R> {
  protected readonly data: R;

  constructor(data: R) {
    this.data = data;
  }

  public copyData(): R {
    return instanceToInstance(this.data);
  }

  public toJsonString(): string {
    return JSON.stringify(instanceToPlain(this.data));
  }
}
