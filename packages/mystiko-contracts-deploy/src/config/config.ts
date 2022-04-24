import developmentJson from '../json/deploy/development.json';
import testnetJson from '../json/deploy/testnet.json';
import mainnetJson from '../json/deploy/mainnet.json';

import { writeJsonFile } from '../common/utils';
import { LOGRED } from '../common/constant';
import { DeployConfig } from './deployConfig';

export function loadConfig(mystikoNetwork: string): DeployConfig {
  let cfg: DeployConfig;
  if (mystikoNetwork === 'testnet') {
    cfg = new DeployConfig(testnetJson);
  } else if (mystikoNetwork === 'mainnet') {
    cfg = new DeployConfig(mainnetJson);
  } else if (mystikoNetwork === 'development') {
    cfg = new DeployConfig(developmentJson);
  } else {
    console.error(LOGRED, 'load config network not support');
    process.exit(-1);
  }
  return cfg;
}

export function saveConfig(mystikoNetwork: string, cfg: DeployConfig) {
  const copyCfg = cfg.clone();

  if (mystikoNetwork === 'testnet') {
    writeJsonFile('./src/json/deploy/testnet.json', copyCfg.toString());
  } else if (mystikoNetwork === 'mainnet') {
    writeJsonFile('./src/json/deploy/mainnet.json', copyCfg.toString());
  } else if (mystikoNetwork === 'development') {
    writeJsonFile('./src/json/deploy/development.json', copyCfg.toString());
  } else {
    console.error(LOGRED, 'save base address config network not support');
  }
}
