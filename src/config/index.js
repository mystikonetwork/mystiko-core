import { BaseConfig } from './common.js';
import {
  ContractConfig,
  AssetType,
  BridgeType,
  isValidAssetType,
  isValidBridgeType,
} from './contractConfig.js';
import { ChainConfig } from './chainConfig.js';
import { check, readJsonFile } from '../utils.js';

export class MystikoConfig extends BaseConfig {
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

  getContractConfig(srcChainId, dstChainId, assetSymbol, bridge) {
    check(typeof srcChainId === 'number', 'type of srcChainId should be number');
    check(typeof dstChainId === 'number', 'type of dstChainId should be number');
    check(typeof assetSymbol === 'string', 'type of tokenSymbol should be string');
    check(isValidBridgeType(bridge), bridge + ' is invalid bridge type');
    if (bridge === BridgeType.LOOP) {
      check(srcChainId === dstChainId, 'loop bridge should have equal chain ids');
    } else {
      check(srcChainId !== dstChainId, 'loop bridge should have non-equal chain ids');
    }
    const srcChainConfig = this.chains[srcChainId];
    check(srcChainConfig, 'chain ' + srcChainId + ' does not exist in config');
    for (let i = 0; i < srcChainConfig.contracts.length; i++) {
      const contract = srcChainConfig.contracts[i];
      if (contract.assetSymbol === assetSymbol && contract.bridgeType === bridge) {
        if (bridge === BridgeType.LOOP) {
          return contract;
        }
        if (contract.peerChainId === dstChainId) {
          return contract;
        }
      }
    }
    throw new Error('cannot find contract information with given parameters');
  }
}

async function readFromFile(configFile) {
  check(typeof configFile === 'string', 'configFile should be string');
  const rawConfig = await readJsonFile(configFile);
  return new MystikoConfig(rawConfig);
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
