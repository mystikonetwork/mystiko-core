import { RxCollection } from 'rxdb';
import { AccountType } from '../schema';
import { Account, AccountMethods } from '../document';
import { defaultMigrationStrategy } from './common';

export type AccountCollectionMethods = {
  clear: () => Promise<Account[]>;
};

export type AccountCollection = RxCollection<AccountType, AccountMethods, AccountCollectionMethods>;

export const accountCollectionMethods: AccountCollectionMethods = {
  clear(this: AccountCollection): Promise<Account[]> {
    return this.find()
      .exec()
      .then((all) => this.bulkRemove(all.map((doc) => doc.id)))
      .then((result) => {
        /* istanbul ignore next */
        if (result.error.length > 0) {
          return Promise.reject(new Error(`clear account collection with errors: ${result.error}`));
        }
        return result.success;
      });
  },
};

export const accountCollectionMigrations = {
  /* istanbul ignore next */
  1: defaultMigrationStrategy,
  /* istanbul ignore next */
  2: defaultMigrationStrategy,
};
