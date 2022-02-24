import mystiko from '@mystiko/client/src/index.js';
import { DefaultClientTestnetConfig, DefaultClientMainnetConfig } from '@mystiko/config';
import Adapter from 'lokijs/src/incremental-indexeddb-adapter.js';

if (window) {
  const initialize = mystiko.initialize;
  mystiko.initialize = (options = {}) => {
    const wrappedOptions = { dbAdapter: new Adapter(), ...options };
    if (!options.conf) {
      if (options.isTestnet === undefined || options.isTestnet === null) {
        wrappedOptions.conf = DefaultClientTestnetConfig;
      } else {
        wrappedOptions.conf = options.isTestnet ? DefaultClientTestnetConfig : DefaultClientMainnetConfig;
      }
    }
    return initialize(wrappedOptions).then((ret) => {
      mystiko.pullers.eventPuller.start();
      return ret;
    });
  };
  window.mystiko = mystiko;
}
