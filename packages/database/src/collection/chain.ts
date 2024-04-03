import { RxCollection } from 'rxdb';
import { ChainType } from '../schema';
import { Chain, ChainMethods } from '../document';
import { defaultMigrationStrategy } from './common';

export type ChainCollectionMethods = {
  clear: () => Promise<Chain[]>;
};

export type ChainCollection = RxCollection<ChainType, ChainMethods, ChainCollectionMethods>;

export const chainCollectionMethods: ChainCollectionMethods = {
  clear(this: ChainCollection): Promise<Chain[]> {
    return this.find()
      .exec()
      .then((all) => this.bulkRemove(all.map((doc) => doc.id)))
      .then((result) => {
        /* istanbul ignore next */
        if (result.error.length > 0) {
          return Promise.reject(new Error(`clear chain collection with errors: ${result.error}`));
        }
        return result.success;
      });
  },
};

export const chainCollectionMigrations = {
  /* istanbul ignore next */
  1: defaultMigrationStrategy,
  /* istanbul ignore next */
  2: defaultMigrationStrategy,
  /* istanbul ignore next */
  3: defaultMigrationStrategy,
  /* istanbul ignore next */
  4: defaultMigrationStrategy,
  /* istanbul ignore next */
  5: defaultMigrationStrategy,
};
