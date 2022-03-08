import { DefaultClientTestnetConfig, DefaultClientMainnetConfig } from '@mystiko/config';
import Adapter from 'lokijs/src/incremental-indexeddb-adapter';
import { Mystiko, InitOptions } from './mystiko';

export class MystikoInBrowser extends Mystiko {
  public initialize(options?: InitOptions) {
    const wrappedOptions: InitOptions = { dbAdapter: new Adapter(), ...options };
    if (!wrappedOptions.conf) {
      if (wrappedOptions.isTestnet === undefined || wrappedOptions.isTestnet === null) {
        wrappedOptions.conf = DefaultClientTestnetConfig;
      } else {
        wrappedOptions.conf = wrappedOptions.isTestnet
          ? DefaultClientTestnetConfig
          : DefaultClientMainnetConfig;
      }
    }
    return super.initialize(wrappedOptions).then((ret) => {
      this.sync?.start();
      return ret;
    });
  }
}

const mystiko = new MystikoInBrowser();
export default mystiko;
