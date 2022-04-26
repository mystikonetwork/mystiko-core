import { RxCollection } from 'rxdb';
import { CommitmentType } from '../schema';
import { Commitment, CommitmentMethods } from '../document';

export type CommitmentCollectionMethods = {
  clear: () => Promise<Commitment[]>;
};

export type CommitmentCollection = RxCollection<
  CommitmentType,
  CommitmentMethods,
  CommitmentCollectionMethods
>;

export const commitmentCollectionMethods: CommitmentCollectionMethods = {
  clear(this: CommitmentCollection): Promise<Commitment[]> {
    return this.find()
      .exec()
      .then((all) => this.bulkRemove(all.map((doc) => doc.id)))
      .then((result) => {
        /* istanbul ignore next */
        if (result.error.length > 0) {
          return Promise.reject(new Error(`clear commitment collection with errors: ${result.error}`));
        }
        return result.success;
      });
  },
};
