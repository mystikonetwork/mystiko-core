import { readJsonFile } from '@mystikonetwork/utils';
import { plainToInstance } from 'class-transformer';
import { ClassConstructor } from 'class-transformer/types/interfaces';
import { validateObject } from '../common';

export class RawConfig {
  public validate(): Promise<void> {
    return validateObject(this).then(() => {});
  }

  public static createFromObject<T extends RawConfig>(cls: ClassConstructor<T>, plain: any): Promise<T> {
    const config = plainToInstance(cls, plain, { excludeExtraneousValues: true, exposeDefaultValues: true });
    return config.validate().then(() => config);
  }

  public static createFromFile<T extends RawConfig>(cls: ClassConstructor<T>, jsonFile: string): Promise<T> {
    return readJsonFile(jsonFile).then((plain) => RawConfig.createFromObject(cls, plain));
  }
}
