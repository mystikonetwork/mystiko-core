import mystiko from './index.js';

if (window) {
  const mystikoInit = mystiko.initialize;
  mystiko.initialize = async (isMainnet = true) => {
    const dbAdapter = (await import('lokijs/src/incremental-indexeddb-adapter.js')).default();
    let configFile;
    if (isMainnet) {
      configFile =
        'https://raw.githubusercontent.com/mystikonetwork/mystiko-static/master/config/mainnet/config.json';
    } else {
      configFile =
        'https://raw.githubusercontent.com/mystikonetwork/mystiko-static/master/config/testnet/config.json';
    }
    const dbFile = isMainnet ? 'mystiko_mainnet.db' : 'mystiko_testnet.db';
    return await mystikoInit(configFile, dbFile, dbAdapter);
  };
  window.mystiko = mystiko;
}
