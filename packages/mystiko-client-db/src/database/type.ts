import { RxDatabase } from 'rxdb';
import { AccountCollection, WalletCollection } from '../collection';
import { ACCOUNT_COLLECTION_NAME, WALLET_COLLECTION_NAME } from '../constants';

export type MystikoClientCollections = {
  [ACCOUNT_COLLECTION_NAME]: AccountCollection;
  [WALLET_COLLECTION_NAME]: WalletCollection;
};

export type MystikoClientDatabase = RxDatabase<MystikoClientCollections>;
