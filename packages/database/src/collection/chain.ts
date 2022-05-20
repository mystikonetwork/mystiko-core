import { RxCollection } from 'rxdb';
import { ChainType } from '../schema';
import { Chain, ChainMethods } from '../document';

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
  1(oldDoc: any) {
    return oldDoc;
  },
};
