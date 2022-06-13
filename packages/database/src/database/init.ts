import { addRxPlugin, createRxDatabase, RxDatabaseCreator } from 'rxdb';
import { RxDBAjvValidatePlugin } from 'rxdb/plugins/ajv-validate';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBKeyCompressionPlugin } from 'rxdb/plugins/key-compression';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';
import { addPouchPlugin, getRxStoragePouch } from 'rxdb/plugins/pouchdb';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import {
  accountCollectionMethods,
  accountCollectionMigrations,
  chainCollectionMethods,
  chainCollectionMigrations,
  commitmentCollectionMethods,
  commitmentCollectionMigrations,
  contractCollectionMethods,
  contractCollectionMigrations,
  depositCollectionMethods,
  depositCollectionMigrations,
  nullifierCollectionMethods,
  nullifierCollectionMigrations,
  transactionCollectionMethods,
  transactionCollectionMigrations,
  walletCollectionMethods,
  walletCollectionMigrations,
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

addRxPlugin(RxDBAjvValidatePlugin);
addRxPlugin(RxDBJsonDumpPlugin);
addRxPlugin(RxDBKeyCompressionPlugin);
addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBUpdatePlugin);

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
      migrationStrategies: accountCollectionMigrations,
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
      migrationStrategies: commitmentCollectionMigrations,
    },
    [CONTRACT_COLLECTION_NAME]: {
      schema: contractSchema,
      methods: contractMethods,
      statics: contractCollectionMethods,
      migrationStrategies: contractCollectionMigrations,
    },
    [DEPOSIT_COLLECTION_NAME]: {
      schema: depositSchema,
      methods: depositMethods,
      statics: depositCollectionMethods,
      migrationStrategies: depositCollectionMigrations,
    },
    [NULLIFIER_COLLECTION_NAME]: {
      schema: nullifierSchema,
      methods: nullifierMethods,
      statics: nullifierCollectionMethods,
      migrationStrategies: nullifierCollectionMigrations,
    },
    [TRANSACTION_COLLECTION_NAME]: {
      schema: transactionSchema,
      methods: transactionMethods,
      statics: transactionCollectionMethods,
      migrationStrategies: transactionCollectionMigrations,
    },
    [WALLET_COLLECTION_NAME]: {
      schema: walletSchema,
      methods: walletMethods,
      statics: walletCollectionMethods,
      migrationStrategies: walletCollectionMigrations,
    },
  });
  return db;
}
