import mystiko from '@mystiko/client/src/index.js';
import { MystikoConfig } from '@mystiko/client/src/config';
import Adapter from 'lokijs/src/incremental-indexeddb-adapter.js';
import DefaultTestnetConfigJson from '@mystiko/contracts/config/default/testnet.json';
import DefaultMainnetConfigJson from '@mystiko/contracts/config/default/mainnet.json';

const DefaultTestnetConfig = new MystikoConfig(DefaultTestnetConfigJson);
const DefaultMainnetConfig = new MystikoConfig(DefaultMainnetConfigJson);

if (window) {
  const initialize = mystiko.initialize;
  mystiko.initialize = (options = {}) => {
    const wrappedOptions = { dbAdapter: new Adapter(), ...options };
    if (!options.conf) {
      if (options.isTestnet === undefined || options.isTestnet === null) {
        wrappedOptions.conf = DefaultTestnetConfig;
      } else {
        wrappedOptions.conf = options.isTestnet ? DefaultTestnetConfig : DefaultMainnetConfig;
      }
    }
    return initialize(wrappedOptions).then((ret) => {
      mystiko.pullers.eventPuller.start();
      return ret;
    });
  };
  window.mystiko = mystiko;
}
