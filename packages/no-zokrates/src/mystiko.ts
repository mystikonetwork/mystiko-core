import { InitOptions, Mystiko } from '@mystikonetwork/core';
import { ZKProverFactory } from '@mystikonetwork/zkp';
import { NopProverFactory } from '@mystikonetwork/zkp-nop';
import { addPouchPlugin, getRxStoragePouch } from 'rxdb/plugins/pouchdb';

export type InitOptionsInBrowser = InitOptions & {
  dbInMemory?: boolean;
};

export class MystikoNoZokrates extends Mystiko {
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

  protected zkProverFactory(): Promise<ZKProverFactory> {
    return Promise.resolve(new NopProverFactory());
  }
}

const mystiko = new MystikoNoZokrates();
export default mystiko;
