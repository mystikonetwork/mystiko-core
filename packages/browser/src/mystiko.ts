import { InitOptions, Mystiko } from '@mystikonetwork/core';
import { ZokratesRuntime, ZokratesWasmRuntime } from '@mystikonetwork/protocol';
import { addPouchPlugin, getRxStoragePouch } from 'rxdb';
import { initialize } from 'zokrates-js';

export type InitOptionsInBrowser = InitOptions & {
  dbInMemory?: boolean;
};

export class MystikoInBrowser extends Mystiko {
  public initialize(options?: InitOptionsInBrowser): Promise<void> {
    const wrappedOptions = { ...options };
    if (!wrappedOptions.dbParams) {
      if (wrappedOptions.dbInMemory) {
        addPouchPlugin(require('pouchdb-adapter-memory'));
        wrappedOptions.dbParams = {
          name: 'mystiko',
          storage: getRxStoragePouch('memory'),
        };
      } else {
        addPouchPlugin(require('pouchdb-adapter-idb'));
        wrappedOptions.dbParams = {
          name: 'mystiko',
          storage: getRxStoragePouch('idb'),
        };
      }
    }
    return super.initialize(wrappedOptions);
  }

  protected async zokratesRuntime(): Promise<ZokratesRuntime> {
    const zokrates = await initialize();
    return new ZokratesWasmRuntime(zokrates);
  }
}

const mystiko = new MystikoInBrowser();
export default mystiko;
