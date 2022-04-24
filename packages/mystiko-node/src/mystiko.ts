import { InitOptions, Mystiko } from '@mystikonetwork/core';
import { ZokratesCliRuntime, ZokratesRuntime } from '@mystikonetwork/protocol';
import chalk, { Chalk } from 'chalk';
import * as fs from 'fs';
import { LoglevelPluginPrefixOptions } from 'loglevel-plugin-prefix';
import { addPouchPlugin, getRxStoragePouch } from 'rxdb';

const colors: { [key: string]: Chalk } = {
  TRACE: chalk.magentaBright,
  DEBUG: chalk.cyanBright,
  INFO: chalk.blueBright,
  WARN: chalk.yellowBright,
  ERROR: chalk.redBright,
};

const loggingOptions: LoglevelPluginPrefixOptions = {
  format: (level, name, timestamp) =>
    `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](level)} ${chalk.green(`${name}:`)}`,
};

export type InitOptionsInNode = InitOptions & {
  dbName?: string;
  dbInMemory?: boolean;
};

export class MystikoInNode extends Mystiko {
  public initialize(options?: InitOptionsInNode): Promise<void> {
    const wrappedOptions: InitOptionsInNode = {
      loggingLevel: 'info',
      loggingOptions,
      ...options,
    };
    if (!wrappedOptions.dbName) {
      if (!fs.existsSync('db')) {
        fs.mkdirSync('db');
      }
      wrappedOptions.dbName = wrappedOptions.isTestnet ? 'db/mystiko_testnet.db' : 'db/mystiko.db';
    }
    if (!wrappedOptions.dbParams) {
      if (wrappedOptions.dbInMemory) {
        addPouchPlugin(require('pouchdb-adapter-memory'));
        wrappedOptions.dbParams = {
          name: wrappedOptions.dbName,
          storage: getRxStoragePouch('memory'),
        };
      } else {
        addPouchPlugin(require('pouchdb-adapter-node-websql'));
        wrappedOptions.dbParams = {
          name: wrappedOptions.dbName,
          storage: getRxStoragePouch('websql'),
        };
      }
    }
    return super.initialize(wrappedOptions);
  }

  protected async zokratesRuntime(): Promise<ZokratesRuntime> {
    const { initialize } = require('zokrates-js/node');
    const zokrates = await initialize();
    return new ZokratesCliRuntime(zokrates);
  }
}

const mystiko = new MystikoInNode();
export default mystiko;
