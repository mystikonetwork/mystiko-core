import { RxCollection } from 'rxdb';
import { WalletType } from '../schema';
import { Wallet, WalletMethods } from '../document';

export type WalletCollectionMethods = {
  clear: () => Promise<Wallet[]>;
};

export type WalletCollection = RxCollection<WalletType, WalletMethods, WalletCollectionMethods>;

export const walletCollectionMethods: WalletCollectionMethods = {
  clear(this: WalletCollection): Promise<Wallet[]> {
    return this.find()
      .exec()
      .then((all) => this.bulkRemove(all.map((doc) => doc.id)))
      .then((result) => {
        /* istanbul ignore next */
        if (result.error.length > 0) {
          return Promise.reject(new Error(`clear wallet collection with errors: ${result.error}`));
        }
        return result.success;
      });
  },
};

export const walletCollectionMigrations = {
  /* istanbul ignore next */
  1(oldDoc: any) {
    return oldDoc;
  },
};
