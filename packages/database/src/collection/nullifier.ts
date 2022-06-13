import { RxCollection } from 'rxdb';
import { NullifierType } from '../schema';
import { Nullifier, NullifierMethods } from '../document';
import { defaultMigrationStrategy } from './common';

export type NullifierCollectionMethods = {
  clear: () => Promise<Nullifier[]>;
};

export type NullifierCollection = RxCollection<NullifierType, NullifierMethods, NullifierCollectionMethods>;

export const nullifierCollectionMethods: NullifierCollectionMethods = {
  clear(this: NullifierCollection): Promise<Nullifier[]> {
    return this.find()
      .exec()
      .then((all) => this.bulkRemove(all.map((doc) => doc.id)))
      .then((result) => {
        /* istanbul ignore next */
        if (result.error.length > 0) {
          return Promise.reject(new Error(`clear nullifier collection with errors: ${result.error}`));
        }
        return result.success;
      });
  },
};

export const nullifierCollectionMigrations = {
  /* istanbul ignore next */
  1: defaultMigrationStrategy,
};
