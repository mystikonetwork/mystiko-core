import fs from 'fs';
import chalk from 'chalk';
import Adapter from 'lokijs/src/loki-fs-structured-adapter';
import mystiko from './mystiko';

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
      options.conf = options.isTestnet ? 'config/cli/testnet.json' : 'config/cli/mainnet.json';
    }
    options.dbFile = options.isTestnet ? 'db/mystiko_testnet.db' : 'db/mystiko.db';
  }
  const wrappedOptions = { dbAdapter: new Adapter(), loggingLevel: 'info', loggingOptions, ...options };
  return initialize(wrappedOptions);
};
export default mystiko;
