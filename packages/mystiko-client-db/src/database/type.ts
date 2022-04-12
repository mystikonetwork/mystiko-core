import { RxDatabase } from 'rxdb';
import {
  AccountCollection,
  CommitmentCollection,
  DepositCollection,
  TransactionCollection,
  WalletCollection,
} from '../collection';
import {
  ACCOUNT_COLLECTION_NAME,
  COMMITMENT_COLLECTION_NAME,
  DEPOSIT_COLLECTION_NAME,
  TRANSACTION_COLLECTION_NAME,
  WALLET_COLLECTION_NAME,
} from '../constants';

export type MystikoClientCollections = {
  [ACCOUNT_COLLECTION_NAME]: AccountCollection;
  [COMMITMENT_COLLECTION_NAME]: CommitmentCollection;
  [DEPOSIT_COLLECTION_NAME]: DepositCollection;
  [TRANSACTION_COLLECTION_NAME]: TransactionCollection;
  [WALLET_COLLECTION_NAME]: WalletCollection;
};

export type MystikoClientDatabase = RxDatabase<MystikoClientCollections>;
