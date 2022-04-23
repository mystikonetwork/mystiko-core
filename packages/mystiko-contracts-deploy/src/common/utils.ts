import { Artifact } from 'hardhat/types';
import { Artifacts } from 'hardhat/internal/artifacts';
import { LOGRED, MainNetwork } from './constant';

const fs = require('fs');

export function getMystikoNetwork(chainNetwork: string) {
  if (chainNetwork === 'hardhat') {
    console.log('development network');
    return 'development';
  }
  let networkType = 'testnet';
  MainNetwork.forEach((n: any) => {
    if (n === chainNetwork) {
      networkType = 'mainnet';
    }
  });

  return networkType;
}

export function readJsonFile(fileName: string): any {
  if (!fs.existsSync(fileName)) {
    console.error(LOGRED, fileName, ' not exist');
    return undefined;
  }

  try {
    const data = fs.readFileSync(fileName);
    return JSON.parse(data);
  } catch (err) {
    console.error(LOGRED, err);
    console.error(LOGRED, 'read file error');
    return undefined;
  }
}

export function writeJsonFile(fileName: string, data: string) {
  try {
    if (!fs.existsSync(fileName)) {
      console.error(LOGRED, fileName, ' not exist');
      return;
    }

    fs.writeFileSync(fileName, data);
  } catch (err) {
    console.error(LOGRED, err);
    console.error(LOGRED, 'write file error');
  }
}

export function toDecimals(amount: string, decimals: number) {
  let padDecimals = '';
  for (let i = 0; i < decimals; i += 1) {
    padDecimals += '0';
  }
  return amount + padDecimals;
}

export function getArtifact(contract: string): Promise<Artifact> {
  const artifactsPath: string = '../mystiko-contracts/artifactsExternal';
  // const artifactsPath: string = "./artifacts";
  const artifacts = new Artifacts(artifactsPath);
  return artifacts.readArtifact(contract);
}
