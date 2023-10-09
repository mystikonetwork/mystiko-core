import { validate } from 'class-validator';

export enum JobTypeEnum {
  TRANSFER = 'TRANSFER',
  WITHDRAW = 'WITHDRAW',
  CHECK_AVAILABLE = 'CHECK_AVAILABLE',
}

export enum QueueSuffix {
  TRANSACT = 'transact',
  AVAILABLE = 'available',
}

export function validateObject<T extends Object>(object: T): Promise<T> {
  return validate(object, { forbidUnknownValues: true }).then((errors) => {
    if (errors.length > 0) {
      return Promise.reject(new Error(`failed to validate config object:\n ${errors}`));
    }
    return object;
  });
}

export function queueName(chainId: number, suffix: string): string {
  return `chain_${chainId}_${suffix}`;
}
