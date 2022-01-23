import loki from 'lokijs';

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
    adapter = new loki.LokiMemoryAdapter();
  }
  if (adapter instanceof loki.LokiMemoryAdapter) {
    lokidb = new loki(dbFile, {
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
    lokidb = new loki(dbFile, {
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

function _createCollectionsIfNotExist(lokidb) {
  for (let i = 0; i < collections.length; i++) {
    if (!lokidb.getCollection(collections[i])) {
      lokidb.addCollection(collections[i]);
    }
  }
}
