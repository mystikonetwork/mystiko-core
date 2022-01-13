import loki from 'lokijs';
import { isBrowser } from 'browser-or-node';

const collections = ['accounts', 'wallets', 'notes', 'deposits', 'withdraws'];

function createCollectionsIfNotExist(lokidb) {
  for (let i = 0; i < collections.length; i++) {
    if (!lokidb.getCollection(collections[i])) {
      lokidb.addCollection(collections[i]);
    }
  }
}

export async function createDatabase(dbFile, inMemory = false) {
  let adapter;
  let lokidb;
  if (!inMemory) {
    if (isBrowser) {
      const IncrementalIndexedDBAdapter = await import('lokijs/src/incremental-indexeddb-adapter.js');
      adapter = new IncrementalIndexedDBAdapter.default();
    } else {
      const LokiFsStructuredAdapter = await import('lokijs/src/loki-fs-structured-adapter.js');
      adapter = new LokiFsStructuredAdapter.default();
    }
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
  } else {
    adapter = new loki.LokiMemoryAdapter();
    lokidb = new loki(dbFile, { adapter });
    createCollectionsIfNotExist(lokidb);
  }
  const db = { database: lokidb };
  for (let i = 0; i < collections.length; i++) {
    db[collections[i]] = lokidb.getCollection(collections[i]);
  }
  return db;
}
