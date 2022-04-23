import developmentJson from '../json/deploy/development.json';
import testnetJson from '../json/deploy/testnet.json';
import mainnetJson from '../json/deploy/mainnet.json';

import { getMystikoNetwork, writeJsonFile } from '../common/utils';
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

export function resetDefaultDevelopmentConfig(cfg: DeployConfig) {
  const chain = cfg.getChain('hardhat');
  if (chain === undefined) {
    return;
  }

  chain.hasher3Address = '';
  chain.rollup1Address = '';
  chain.rollup4Address = '';
  chain.rollup16Address = '';
  chain.transaction1x0VerifierAddress = '';
  chain.transaction1x1VerifierAddress = '';
  chain.transaction1x2VerifierAddress = '';
  chain.transaction2x0VerifierAddress = '';
  chain.transaction2x1VerifierAddress = '';
  chain.transaction2x2VerifierAddress = '';

  saveConfig('development', cfg);
}

export function saveBaseAddressConfig(
  chainNetwork: string,
  hasher3Address: string,
  rollup1Address: string,
  rollup4Address: string,
  rollup16Address: string,
  transaction1x0VerifierAddress: string,
  transaction1x1VerifierAddress: string,
  transaction1x2VerifierAddress: string,
  transaction2x0VerifierAddress: string,
  transaction2x1VerifierAddress: string,
  transaction2x2VerifierAddress: string,
) {
  const mystikoNetwork = getMystikoNetwork(chainNetwork);
  const cfg = loadConfig(mystikoNetwork);
  if (cfg === undefined) {
    return;
  }

  const chain = cfg.getChain(chainNetwork);
  if (chain === undefined) {
    console.log(LOGRED, 'chain configure not exist');
    return;
  }

  chain.hasher3Address = hasher3Address;
  chain.rollup1Address = rollup1Address;
  chain.rollup4Address = rollup4Address;
  chain.rollup16Address = rollup16Address;
  chain.transaction1x0VerifierAddress = transaction1x0VerifierAddress;
  chain.transaction1x1VerifierAddress = transaction1x1VerifierAddress;
  chain.transaction1x2VerifierAddress = transaction1x2VerifierAddress;
  chain.transaction2x0VerifierAddress = transaction2x0VerifierAddress;
  chain.transaction2x1VerifierAddress = transaction2x1VerifierAddress;
  chain.transaction2x2VerifierAddress = transaction2x2VerifierAddress;

  saveConfig(mystikoNetwork, cfg);
}
