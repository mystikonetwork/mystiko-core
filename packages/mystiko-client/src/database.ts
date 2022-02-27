import Loki, { Collection } from 'lokijs';
import { readFile } from '@mystiko/utils';
import { ID_KEY } from './model';

const collections = ['accounts', 'wallets', 'notes', 'deposits', 'withdraws', 'contracts', 'events'];

export interface MystikoDatabase {
  database: Loki;
  wallets: Collection;
  accounts: Collection;
  notes: Collection;
  deposits: Collection;
  withdraws: Collection;
  contracts: Collection;
  events: Collection;
  [key: string]: Collection | Loki;
}

function createCollectionsIfNotExist(lokidb: Loki) {
  for (let i = 0; i < collections.length; i += 1) {
    if (!lokidb.getCollection(collections[i])) {
      lokidb.addCollection(collections[i]);
    }
  }
}

/**
 * @function module:mystiko/db.createDatabase
 * @desc create Loki database with given filename and persistence adapter.
 * @param {string} dbFile name of database file.
 * @param {LokiPersistenceAdapter} adapter database adapter for persisting data.
 * @returns {Promise<MystikoDatabase>} an object including all collections of database.
 */
export async function createDatabase(
  dbFile: string,
  adapter?: LokiPersistenceAdapter,
): Promise<MystikoDatabase> {
  let lokidb: Loki;
  const dbAdapter = adapter || new Loki.LokiMemoryAdapter();
  if (dbAdapter instanceof Loki.LokiMemoryAdapter) {
    lokidb = new Loki(dbFile, {
      adapter: dbAdapter,
    });
    createCollectionsIfNotExist(lokidb);
  } else {
    let dbLoadResolve: (value: void | PromiseLike<void>) => void;
    let dbLoadReject: (reason?: any) => void;
    const dbLoadPromise = new Promise((resolve, reject) => {
      dbLoadResolve = resolve;
      dbLoadReject = reject;
    });
    const dbLoadCallback = () => {
      try {
        createCollectionsIfNotExist(lokidb);
        if (dbLoadResolve) {
          dbLoadResolve();
        }
      } catch (error) {
        if (dbLoadReject) {
          dbLoadReject(error);
        }
      }
    };
    lokidb = new Loki(dbFile, {
      autoload: true,
      autoloadCallback: dbLoadCallback,
      autosave: true,
      autosaveInterval: 1000,
      adapter: dbAdapter,
    });
    await dbLoadPromise;
  }
  const db: { [key: string]: any } = { database: lokidb };
  for (let i = 0; i < collections.length; i += 1) {
    db[collections[i]] = lokidb.getCollection(collections[i]);
  }
  return db as MystikoDatabase;
}

/**
 * @function module:mystiko/db.exportDataAsString
 * @desc export database as a serialized JSON string.
 * @param {MystikoDatabase} database wrapped database object.
 * @returns {string} an serialized Loki database as a String.
 */
export function exportDataAsString(database: MystikoDatabase): string {
  return database.database.serialize();
}

/**
 * @function module:mystiko/db.importDataFromJson
 * @desc import the serialized JSON string into database.
 * @param {MystikoDatabase} database wrapped database object.
 * @param {string} jsonString a serialized json object as string.
 */
export function importDataFromJson(database: MystikoDatabase, jsonString: string) {
  const tempDb = new Loki('temp.db');
  tempDb.loadJSON(jsonString);
  for (let i = 0; i < collections.length; i += 1) {
    const oldCollection = database[collections[i]];
    if (oldCollection instanceof Collection) {
      oldCollection.clear({ removeIndices: true });
      const newCollection = tempDb.getCollection(collections[i]);
      if (newCollection) {
        newCollection.find().forEach((item) => {
          /* eslint-disable-next-line no-param-reassign */
          delete item[ID_KEY];
          oldCollection.insert(item);
        });
      }
    }
  }
  database.database.saveDatabase();
}

/**
 * @function module:mystiko/db.importDataFromJsonFile
 * @desc import the file contains the serialized JSON into database.
 * @param {MystikoDatabase} database wrapped database object.
 * @param {string} jsonFile the file path of serialized JSON data.
 */
export async function importDataFromJsonFile(database: MystikoDatabase, jsonFile: string) {
  const jsonString = await readFile(jsonFile);
  importDataFromJson(database, jsonString.toString());
}
