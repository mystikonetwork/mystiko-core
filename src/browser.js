import mystiko from './index.js';

if (window) {
  const mystikoInit = mystiko.initialize;
  mystiko.initialize = async (configFile = undefined, isMainnet = true) => {
    const Adapter = (await import('lokijs/src/incremental-indexeddb-adapter.js')).default;
    if (!configFile) {
      if (isMainnet) {
        configFile =
          'https://raw.githubusercontent.com/mystikonetwork/mystiko-static/master/config/mainnet/config.json';
      } else {
        configFile =
          'https://raw.githubusercontent.com/mystikonetwork/mystiko-static/master/config/testnet/config.json';
      }
    }
    const dbFile = isMainnet ? 'mystiko_mainnet.db' : 'mystiko_testnet.db';
    return await mystikoInit(configFile, dbFile, new Adapter());
  };
  window.mystiko = mystiko;
}
