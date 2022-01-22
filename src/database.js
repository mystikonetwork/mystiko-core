import loki from 'lokijs';

const collections = ['accounts', 'wallets', 'notes', 'deposits', 'withdraws'];

/**
 * @module module:mystiko/db
 * @desc a collection of functions for database operation.
 */

function createCollectionsIfNotExist(lokidb) {
  for (let i = 0; i < collections.length; i++) {
    if (!lokidb.getCollection(collections[i])) {
      lokidb.addCollection(collections[i]);
    }
  }
}

/**
 * @memberOf module:mystiko/db
 * @desc create Loki database with given filename and persistence adapter.
 * @param {string} dbFile name of database file.
 * @param {Object} adapter database adapter for persisting data.
 * @returns {Promise<WrappedDb>} an object including all collections of database.
 */
export async function createDatabase(dbFile, adapter) {
  let lokidb;
  if (!adapter) {
    adapter = new loki.LokiMemoryAdapter();
  }
  if (adapter instanceof loki.LokiMemoryAdapter) {
    lokidb = new loki(dbFile, {
      adapter: adapter,
    });
    createCollectionsIfNotExist(lokidb);
  } else {
    let dbLoadResolve;
    let dbLoadReject;
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
    lokidb = new loki(dbFile, {
      autoload: true,
      autoloadCallback: dbLoadCallback,
      autosave: true,
      autosaveInterval: 5000,
      adapter: adapter,
    });
    await dbLoadPromise;
  }
  /**
   * @typedef {Object} WrappedDb
   * @property {Loki} db instance of Loki's raw database object.
   * @property {Collection} wallets Loki Collection of wallet data.
   * @property {Collection} accounts Loki Collection of account data.
   * @property {Collection} notes Loki Collection of private note data.
   * @property {Collection} deposits Loki Collection of deposit transaction data.
   * @property {Collection} withdraws Loki Collection of withdrawal transaction data.
   */
  const db = { database: lokidb };
  for (let i = 0; i < collections.length; i++) {
    db[collections[i]] = lokidb.getCollection(collections[i]);
  }
  return db;
}
