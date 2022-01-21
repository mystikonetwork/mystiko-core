import mystiko from './index.js';
import Adapter from 'lokijs/src/incremental-indexeddb-adapter.js';

if (window) {
  const initialize = mystiko.initialize;
  mystiko.initialize = ({ isTestnet = true, conf = undefined, dbFile = undefined } = {}) => {
    return initialize({ isTestnet, conf, dbFile, dbAdapter: new Adapter() });
  };
  window.mystiko = mystiko;
}
