import chalk, { Chalk } from 'chalk';
import fs from 'fs';
import { LoglevelPluginPrefixOptions } from 'loglevel-plugin-prefix';
import Adapter from 'lokijs/src/loki-fs-structured-adapter';
import { MystikoConfig, DefaultClientConfigJson } from '@mystiko/config';
import { Mystiko, InitOptions } from './mystiko';

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

const defaultTestnetCircuitsConfig = [
  {
    name: 'circom-1.0',
    wasmFile: 'node_modules/@mystiko/circuits/dist/circom/dev/Withdraw.wasm.gz',
    zkeyFile: 'node_modules/@mystiko/circuits/dist/circom/dev/Withdraw.zkey.gz',
    vkeyFile: 'node_modules/@mystiko/circuits/dist/circom/dev/Withdraw.vkey.json.gz',
  },
];

export const DefaultTestnetConfig = new MystikoConfig({
  ...DefaultClientConfigJson.testnet,
  circuits: defaultTestnetCircuitsConfig,
});
export const DefaultMainnetConfig = new MystikoConfig(DefaultClientConfigJson.mainnet);

export class MystikoInNode extends Mystiko {
  public initialize(options?: InitOptions): Promise<void> {
    const wrappedOptions: InitOptions = {
      dbAdapter: new Adapter(),
      loggingLevel: 'info',
      loggingOptions,
      ...options,
    };
    if (wrappedOptions.isTestnet === undefined || wrappedOptions.isTestnet === null) {
      wrappedOptions.isTestnet = true;
    }
    if (!wrappedOptions.conf) {
      wrappedOptions.conf = wrappedOptions.isTestnet ? DefaultTestnetConfig : DefaultMainnetConfig;
    }
    if (!wrappedOptions.dbFile) {
      if (!fs.existsSync('db')) {
        fs.mkdirSync('db');
      }
      wrappedOptions.dbFile = wrappedOptions.isTestnet ? 'db/mystiko_testnet.db' : 'db/mystiko.db';
    }
    return super.initialize(wrappedOptions);
  }
}

const mystiko = new MystikoInNode();
export default mystiko;
