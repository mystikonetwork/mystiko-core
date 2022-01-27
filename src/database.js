import Loki from 'lokijs';
import { check, readFile } from './utils';
import { ID_KEY } from './model';

const collections = ['accounts', 'wallets', 'notes', 'deposits', 'withdraws'];

/**
 * @external external:Loki
 * @see {@link https://techfort.github.io/LokiJS/Loki.html Loki}
 */
/**
 * @external external:Collection
 * @see {@link https://techfort.github.io/LokiJS/Collection.html Collection}
 */
/**
 * @module module:mystiko/db
 * @desc a collection of functions for database operation.
 */
/**
 * @typedef WrappedDb
 * @name module:mystiko/db.WrappedDb
 * @property {external:Loki} db instance of Loki's raw database object.
 * @property {external:Collection} wallets Loki Collection of wallet data.
 * @property {external:Collection} accounts Loki Collection of account data.
 * @property {external:Collection} notes Loki Collection of private note data.
 * @property {external:Collection} deposits Loki Collection of deposit transaction data.
 * @property {external:Collection} withdraws Loki Collection of withdrawal transaction data.
 */

/**
 * @function module:mystiko/db.createDatabase
 * @desc create Loki database with given filename and persistence adapter.
 * @param {string} dbFile name of database file.
 * @param {Object} adapter database adapter for persisting data.
 * @returns {Promise<module:mystiko/db.WrappedDb>} an object including all collections of database.
 */
export async function createDatabase(dbFile, adapter) {
  let lokidb;
  if (!adapter) {
    adapter = new Loki.LokiMemoryAdapter();
  }
  if (adapter instanceof Loki.LokiMemoryAdapter) {
    lokidb = new Loki(dbFile, {
      adapter: adapter,
    });
    _createCollectionsIfNotExist(lokidb);
  } else {
    let dbLoadResolve;
    let dbLoadReject;
    const dbLoadPromise = new Promise((resolve, reject) => {
      dbLoadResolve = resolve;
      dbLoadReject = reject;
    });
    const dbLoadCallback = () => {
      try {
        _createCollectionsIfNotExist(lokidb);
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
      autosaveInterval: 5000,
      adapter: adapter,
    });
    await dbLoadPromise;
  }
  const db = { database: lokidb };
  for (let i = 0; i < collections.length; i++) {
    db[collections[i]] = lokidb.getCollection(collections[i]);
  }
  return db;
}

/**
 * @function module:mystiko/db.exportDataAsString
 * @param {module:mystiko/db.WrappedDb} wrappedDb wrapped database object.
 * @property {external:Loki} wrappedDb.database instance of Loki's raw database object.
 * @returns {string} an serialized Loki database as a String.
 */
export function exportDataAsString({ database }) {
  check(database instanceof Loki, 'database should be an instance of Loki');
  return database.serialize();
}

/**
 * @function module:mystiko/db.importDataFromJson
 * @param {module:mystiko/db.WrappedDb} wrappedDb wrapped database object.
 * @param {string} jsonString a serialized json object as string.
 */
export function importDataFromJson(wrappedDb, jsonString) {
  check(wrappedDb && wrappedDb.database instanceof Loki, 'wrappedDb.database should be instance of Loki');
  check(typeof jsonString === 'string', 'type of jsonString should be a string');
  const tempDb = new Loki('temp.db');
  tempDb.loadJSON(jsonString);
  for (let i = 0; i < collections.length; i++) {
    const oldCollection = wrappedDb[collections[i]];
    oldCollection.clear({ removeIndices: true });
    const newCollection = tempDb.getCollection(collections[i]);
    if (newCollection) {
      newCollection.find().forEach((item) => {
        delete item[ID_KEY];
        oldCollection.insert(item);
      });
    }
  }
  wrappedDb.database.saveDatabase();
}

/**
 * @function module:mystiko/db.importDataFromJsonFile
 * @param {module:mystiko/db.WrappedDb} wrappedDb wrapped database object.
 * @param {string} jsonFile the file path of serialized JSON data.
 */
export async function importDataFromJsonFile(wrappedDb, jsonFile) {
  check(typeof jsonFile === 'string', 'type of jsonFile should be a string');
  const jsonString = await readFile(jsonFile);
  importDataFromJson(wrappedDb, jsonString.toString());
}

function _createCollectionsIfNotExist(lokidb) {
  for (let i = 0; i < collections.length; i++) {
    if (!lokidb.getCollection(collections[i])) {
      lokidb.addCollection(collections[i]);
    }
  }
}
