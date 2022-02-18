import fs from 'fs';
import chalk from 'chalk';
import Adapter from 'lokijs/src/loki-fs-structured-adapter';
import mystiko from '@mystiko/client/src/index.js';
import { MystikoConfig } from '@mystiko/client/src/config';

import DefaultTestnetConfigJson from '@mystiko/contracts/config/default/testnet.json';
import DefaultMainnetConfigJson from '@mystiko/contracts/config/default/mainnet.json';

const DefaultTestnetConfig = new MystikoConfig(DefaultTestnetConfigJson);
const DefaultMainnetConfig = new MystikoConfig(DefaultMainnetConfigJson);

const colors = {
  TRACE: chalk.magentaBright,
  DEBUG: chalk.cyanBright,
  INFO: chalk.blueBright,
  WARN: chalk.yellowBright,
  ERROR: chalk.redBright,
};

const loggingOptions = {
  format: (level, name, timestamp) => {
    return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](level)} ${chalk.green(`${name}:`)}`;
  },
};
const initialize = mystiko.initialize;
mystiko.initialize = (options = {}) => {
  if (!options.dbFile) {
    if (!fs.existsSync('db')) {
      fs.mkdirSync('db');
    }
    if (options.isTestnet === undefined || options.isTestnet === null) {
      options.isTestnet = true;
    }
    if (!options.conf) {
      options.conf = options.isTestnet ? DefaultTestnetConfig : DefaultMainnetConfig;
    }
    options.dbFile = options.isTestnet ? 'db/mystiko_testnet.db' : 'db/mystiko.db';
  }
  const wrappedOptions = { dbAdapter: new Adapter(), loggingLevel: 'info', loggingOptions, ...options };
  return initialize(wrappedOptions);
};
export default mystiko;
