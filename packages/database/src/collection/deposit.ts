import { RxCollection } from 'rxdb';
import { DepositType } from '../schema';
import { Deposit, DepositMethods } from '../document';
import { defaultMigrationStrategy } from './common';

export type DepositCollectionMethods = {
  clear: () => Promise<Deposit[]>;
};

export type DepositCollection = RxCollection<DepositType, DepositMethods, DepositCollectionMethods>;

export const depositCollectionMethods: DepositCollectionMethods = {
  clear(this: DepositCollection): Promise<Deposit[]> {
    return this.find()
      .exec()
      .then((all) => this.bulkRemove(all.map((doc) => doc.id)))
      .then((result) => {
        /* istanbul ignore next */
        if (result.error.length > 0) {
          return Promise.reject(new Error(`clear deposit collection with errors: ${result.error}`));
        }
        return result.success;
      });
  },
};

export const depositCollectionMigrations = {
  /* istanbul ignore next */
  1: defaultMigrationStrategy,
  2: (oldDoc: any) => /* istanbul ignore next */ {
    // eslint-disable-next-line no-param-reassign
    oldDoc.serviceFee = '0';
    return oldDoc;
  },
};
