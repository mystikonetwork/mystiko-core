import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { InitOptions, Mystiko } from '@mystikonetwork/core';
import { ZKProverFactory } from '@mystikonetwork/zkp';
import { ZokratesBrowserProverFactory } from '@mystikonetwork/zkp-browser';
import { addPouchPlugin, getRxStoragePouch } from 'rxdb/plugins/pouchdb';

export type InitOptionsInBrowser = InitOptions & {
  dbInMemory?: boolean;
};

export class MystikoInBrowser extends Mystiko {
  public initialize(options?: InitOptionsInBrowser): Promise<void> {
    const wrappedOptions = { ...options };

    if (!wrappedOptions.grpcTransportFactory) {
      wrappedOptions.grpcTransportFactory = (baseUrl) =>
        createGrpcWebTransport({
          baseUrl,
        });
    }
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
    return Promise.resolve(new ZokratesBrowserProverFactory());
  }
}

const mystiko = new MystikoInBrowser();
export default mystiko;
