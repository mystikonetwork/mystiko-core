import loki from 'lokijs';

const collections = ['accounts', 'wallets', 'notes', 'deposits', 'withdraws'];

function createCollectionsIfNotExist(lokidb) {
  for (let i = 0; i < collections.length; i++) {
    if (!lokidb.getCollection(collections[i])) {
      lokidb.addCollection(collections[i]);
    }
  }
}

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
  const db = { database: lokidb };
  for (let i = 0; i < collections.length; i++) {
    db[collections[i]] = lokidb.getCollection(collections[i]);
  }
  return db;
}
