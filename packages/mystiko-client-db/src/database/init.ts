import { addPouchPlugin, createRxDatabase, getRxStoragePouch, RxDatabaseCreator } from 'rxdb';
import { walletCollectionMethods } from '../collection';
import { walletMethods } from '../document';
import { MystikoClientCollections, MystikoClientDatabase } from './type';
import { walletSchema } from '../schema';

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
    wallets: {
      schema: walletSchema,
      methods: walletMethods,
      statics: walletCollectionMethods,
    },
  });
  return db;
}
