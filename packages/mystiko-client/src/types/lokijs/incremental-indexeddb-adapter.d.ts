declare module 'lokijs/src/incremental-indexeddb-adapter' {
  class IncrementalIndexedDBAdapter implements LokiPersistenceAdapter {
    mode?: string | undefined;
    loadDatabase(dbname: string, callback: (value: any) => void): void;
    deleteDatabase?(dbnameOrOptions: any, callback: (err?: Error | null, data?: any) => void): void;
    exportDatabase?(dbname: string, dbref: Loki, callback: (err: Error | null) => void): void;
    saveDatabase?(dbname: string, dbstring: any, callback: (err?: Error | null) => void): void;
  }
  export = IncrementalIndexedDBAdapter;
}
