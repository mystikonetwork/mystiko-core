import { addRxPlugin, createRxDatabase, RxDatabaseCreator } from 'rxdb';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';
import { addPouchPlugin, getRxStoragePouch } from 'rxdb/plugins/pouchdb';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBValidatePlugin } from 'rxdb/plugins/validate';
import {
  accountCollectionMethods,
  chainCollectionMethods,
  chainCollectionMigrations,
  commitmentCollectionMethods,
  contractCollectionMethods,
  depositCollectionMethods,
  nullifierCollectionMethods,
  transactionCollectionMethods,
  walletCollectionMethods,
} from '../collection';
import {
  ACCOUNT_COLLECTION_NAME,
  CHAIN_COLLECTION_NAME,
  COMMITMENT_COLLECTION_NAME,
  CONTRACT_COLLECTION_NAME,
  DEPOSIT_COLLECTION_NAME,
  NULLIFIER_COLLECTION_NAME,
  TRANSACTION_COLLECTION_NAME,
  WALLET_COLLECTION_NAME,
} from '../constants';
import {
  accountMethods,
  chainMethods,
  commitmentMethods,
  contractMethods,
  depositMethods,
  nullifierMethods,
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
  nullifierSchema,
  transactionSchema,
  walletSchema,
} from '../schema';

export async function initDatabase(params?: RxDatabaseCreator): Promise<MystikoDatabase> {
  addRxPlugin(RxDBJsonDumpPlugin);
  addRxPlugin(RxDBLeaderElectionPlugin);
  addRxPlugin(RxDBMigrationPlugin);
  addRxPlugin(RxDBUpdatePlugin);
  addRxPlugin(RxDBValidatePlugin);
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
      migrationStrategies: chainCollectionMigrations,
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
    [NULLIFIER_COLLECTION_NAME]: {
      schema: nullifierSchema,
      methods: nullifierMethods,
      statics: nullifierCollectionMethods,
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
