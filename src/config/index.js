import * as fastfile from 'fastfile';
import { BaseConfig } from './common.js';
import {
  ContractConfig,
  AssetType,
  BridgeType,
  isValidAssetType,
  isValidBridgeType,
} from './contractConfig.js';
import { ChainConfig } from './chainConfig.js';
import { check } from '../utils.js';

class MystikoConfig extends BaseConfig {
  constructor(rawConfig) {
    super(rawConfig);
    this.chains = {};
    Object.keys(rawConfig).forEach((key) => {
      const chain = new ChainConfig(rawConfig[key]);
      this.config[key] = chain;
      this.chains[chain.chainId] = chain;
    });
    this.chainIds.forEach((chainId) => {
      const chainConfig = this.chains[chainId];
      chainConfig.contracts.forEach((contract) => {
        if (contract.bridgeType !== BridgeType.LOOP) {
          check(this.chains[contract.peerChainId], 'non-exist peerChainId');
          const peerChain = this.chains[contract.peerChainId];
          check(peerChain.getContract(contract.peerContractAddress), 'non-exist peerChainContract');
          const peerContract = peerChain.getContract(contract.peerContractAddress);
          check(peerContract.bridgeType === contract.bridgeType, 'bridge type does not match');
          check(peerContract.assetDecimals === contract.assetDecimals, 'token decimals does not match');
          check(peerContract.peerChainId === chainId, 'chain id does not match');
          check(peerContract.peerContractAddress === contract.address, 'contract address does not match');
        }
      });
    });
  }

  get chainIds() {
    return Object.keys(this.chains).map((chainId) => parseInt(chainId));
  }

  getChainConfig(chainId) {
    check(typeof chainId === 'number' || chainId instanceof Number, 'chainId should be number or Number');
    return this.chains[chainId];
  }
}

async function readFromFile(configFile) {
  check(typeof configFile === 'string', 'configFile should be string');
  const fd = await fastfile.readExisting(configFile);
  const data = await fd.read(fd.totalSize);
  await fd.close();
  return new MystikoConfig(JSON.parse(Buffer.from(data)));
}

export default {
  AssetType,
  BridgeType,
  isValidAssetType,
  isValidBridgeType,
  BaseConfig,
  ContractConfig,
  ChainConfig,
  MystikoConfig,
  readFromFile,
};
