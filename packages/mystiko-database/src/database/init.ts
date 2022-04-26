import { addPouchPlugin, createRxDatabase, getRxStoragePouch, RxDatabaseCreator } from 'rxdb';
import {
  accountCollectionMethods,
  chainCollectionMethods,
  commitmentCollectionMethods,
  contractCollectionMethods,
  depositCollectionMethods,
  transactionCollectionMethods,
  walletCollectionMethods,
} from '../collection';
import {
  ACCOUNT_COLLECTION_NAME,
  CHAIN_COLLECTION_NAME,
  COMMITMENT_COLLECTION_NAME,
  CONTRACT_COLLECTION_NAME,
  DEPOSIT_COLLECTION_NAME,
  TRANSACTION_COLLECTION_NAME,
  WALLET_COLLECTION_NAME,
} from '../constants';
import {
  accountMethods,
  chainMethods,
  commitmentMethods,
  contractMethods,
  depositMethods,
  transactionMethods,
  walletMethods,
} from '../document';
import { MystikoClientCollections, MystikoDatabase } from './type';
import {
  accountSchema,
  chainSchema,
  commitmentSchema,
  contractSchema,
  depositSchema,
  transactionSchema,
  walletSchema,
} from '../schema';

export async function initDatabase(params?: RxDatabaseCreator): Promise<MystikoDatabase> {
  let dbPromise: Promise<MystikoDatabase>;
  if (params) {
    dbPromise = createRxDatabase<MystikoClientCollections>(params);
  } else {
    // eslint-disable-next-line global-require
    addPouchPlugin(require('pouchdb-adapter-memory'));
    dbPromise = createRxDatabase<MystikoClientCollections>({
      name: 'mystiko-client-db',
      storage: getRxStoragePouch('memory'),
    });
  }
  const db: MystikoDatabase = await dbPromise;
  await db.addCollections({
    [ACCOUNT_COLLECTION_NAME]: {
      schema: accountSchema,
      methods: accountMethods,
      statics: accountCollectionMethods,
    },
    [CHAIN_COLLECTION_NAME]: {
      schema: chainSchema,
      methods: chainMethods,
      statics: chainCollectionMethods,
    },
    [COMMITMENT_COLLECTION_NAME]: {
      schema: commitmentSchema,
      methods: commitmentMethods,
      statics: commitmentCollectionMethods,
    },
    [CONTRACT_COLLECTION_NAME]: {
      schema: contractSchema,
      methods: contractMethods,
      statics: contractCollectionMethods,
    },
    [DEPOSIT_COLLECTION_NAME]: {
      schema: depositSchema,
      methods: depositMethods,
      statics: depositCollectionMethods,
    },
    [TRANSACTION_COLLECTION_NAME]: {
      schema: transactionSchema,
      methods: transactionMethods,
      statics: transactionCollectionMethods,
    },
    [WALLET_COLLECTION_NAME]: {
      schema: walletSchema,
      methods: walletMethods,
      statics: walletCollectionMethods,
    },
  });
  return db;
}
