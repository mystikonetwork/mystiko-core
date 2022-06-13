import { RxCollection } from 'rxdb';
import { ContractType } from '../schema';
import { Contract, ContractMethods } from '../document';

export type ContractCollectionMethods = {
  clear: () => Promise<Contract[]>;
};

export type ContractCollection = RxCollection<ContractType, ContractMethods, ContractCollectionMethods>;

export const contractCollectionMethods: ContractCollectionMethods = {
  clear(this: ContractCollection): Promise<Contract[]> {
    return this.find()
      .exec()
      .then((all) => this.bulkRemove(all.map((doc) => doc.id)))
      .then((result) => {
        /* istanbul ignore next */
        if (result.error.length > 0) {
          return Promise.reject(new Error(`clear contract collection with errors: ${result.error}`));
        }
        return result.success;
      });
  },
};

export const contractCollectionMigrations = {
  /* istanbul ignore next */
  1(oldDoc: any) {
    return oldDoc;
  },
};
