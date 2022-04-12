import { addPouchPlugin, createRxDatabase, getRxStoragePouch, RxDatabaseCreator } from 'rxdb';
import {
  accountCollectionMethods,
  commitmentCollectionMethods,
  depositCollectionMethods,
  transactionCollectionMethods,
  walletCollectionMethods,
} from '../collection';
import {
  ACCOUNT_COLLECTION_NAME,
  COMMITMENT_COLLECTION_NAME,
  DEPOSIT_COLLECTION_NAME,
  TRANSACTION_COLLECTION_NAME,
  WALLET_COLLECTION_NAME,
} from '../constants';
import {
  accountMethods,
  commitmentMethods,
  depositMethods,
  transactionMethods,
  walletMethods,
} from '../document';
import { MystikoClientCollections, MystikoClientDatabase } from './type';
import { accountSchema, commitmentSchema, depositSchema, transactionSchema, walletSchema } from '../schema';

export async function initDatabase(params?: RxDatabaseCreator): Promise<MystikoClientDatabase> {
  let dbPromise: Promise<MystikoClientDatabase>;
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
  const db: MystikoClientDatabase = await dbPromise;
  await db.addCollections({
    [ACCOUNT_COLLECTION_NAME]: {
      schema: accountSchema,
      methods: accountMethods,
      statics: accountCollectionMethods,
    },
    [COMMITMENT_COLLECTION_NAME]: {
      schema: commitmentSchema,
      methods: commitmentMethods,
      statics: commitmentCollectionMethods,
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
