import mystiko from './mystiko.js';
import Adapter from 'lokijs/src/incremental-indexeddb-adapter.js';

if (window) {
  const initialize = mystiko.initialize;
  mystiko.initialize = (options = {}) => {
    const wrappedOptions = { dbAdapter: new Adapter(), ...options };
    return initialize(wrappedOptions).then((ret) => {
      mystiko.pullers.eventPuller.start();
      return ret;
    });
  };
  window.mystiko = mystiko;
}
