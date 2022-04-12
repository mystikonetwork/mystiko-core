import { RxDatabase } from 'rxdb';
import { AccountCollection, CommitmentCollection, WalletCollection } from '../collection';
import { ACCOUNT_COLLECTION_NAME, COMMITMENT_COLLECTION_NAME, WALLET_COLLECTION_NAME } from '../constants';

export type MystikoClientCollections = {
  [ACCOUNT_COLLECTION_NAME]: AccountCollection;
  [COMMITMENT_COLLECTION_NAME]: CommitmentCollection;
  [WALLET_COLLECTION_NAME]: WalletCollection;
};

export type MystikoClientDatabase = RxDatabase<MystikoClientCollections>;
