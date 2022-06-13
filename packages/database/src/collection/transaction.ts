import { RxCollection } from 'rxdb';
import { TransactionType } from '../schema';
import { Transaction, TransactionMethods } from '../document';

export type TransactionCollectionMethods = {
  clear: () => Promise<Transaction[]>;
};

export type TransactionCollection = RxCollection<
  TransactionType,
  TransactionMethods,
  TransactionCollectionMethods
>;

export const transactionCollectionMethods: TransactionCollectionMethods = {
  clear(this: TransactionCollection): Promise<Transaction[]> {
    return this.find()
      .exec()
      .then((all) => this.bulkRemove(all.map((doc) => doc.id)))
      .then((result) => {
        /* istanbul ignore next */
        if (result.error.length > 0) {
          return Promise.reject(new Error(`clear transaction collection with errors: ${result.error}`));
        }
        return result.success;
      });
  },
};

export const transactionCollectionMigrations = {
  /* istanbul ignore next */
  1(oldDoc: any) {
    return oldDoc;
  },
};
