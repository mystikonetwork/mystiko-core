import { ethers } from 'ethers';
import { AssetType, BridgeType, ContractConfig } from '../config/contractConfig.js';
import { MystikoConfig } from '../config/mystikoConfig.js';
import { ProviderPool } from './provider.js';
import { check, readJsonFile } from '../utils.js';
import erc20Abi from './abi/ERC20.json';

export class MystikoContract {
  constructor(contract) {
    check(
      contract instanceof ContractConfig || contract instanceof ethers.Contract,
      'incorrect contract type',
    );
    if (contract instanceof ContractConfig) {
      this.config = contract;
    }
    if (contract instanceof ethers.Contract) {
      this.contract = contract;
    }
  }

  async connect(providerOrSigner, contractGenerator = undefined) {
    if (!contractGenerator) {
      contractGenerator = (address, abi, providerOrSigner) => {
        return new ethers.Contract(address, abi, providerOrSigner);
      };
    }
    if (this.contract) {
      return this.contract.connect(providerOrSigner);
    } else {
      let abi = await readJsonFile(this.config.abiFile);
      if (!(abi instanceof Array)) {
        check(abi['abi'] && abi['abi'] instanceof Array, 'the json does not have abi array');
        abi = abi.abi;
      }
      check(abi, 'failed to get abi information from ' + this.config.abiFile);
      this.contract = contractGenerator(this.config.address, abi, providerOrSigner);
      return this.contract;
    }
  }
}

export class ContractPool {
  constructor(config, providerPool) {
    check(config instanceof MystikoConfig, 'config should be instance of MystikoConfig');
    check(providerPool instanceof ProviderPool, 'providerPool should be instance of ProviderPool');
    this.config = config;
    this.providerPool = providerPool;
    this.pool = {};
    this.assetPool = {};
  }

  async connect(contractGenerator = undefined) {
    const promises = [];
    this.config.chainIds.forEach((chainId) => {
      if (!this.pool[chainId]) {
        this.pool[chainId] = {};
        this.assetPool[chainId] = {};
      }
      const chainConfig = this.config.getChainConfig(chainId);
      const provider = this.providerPool.getProvider(chainId);
      chainConfig.contracts.forEach((contractConfig) => {
        this.pool[chainId][contractConfig.address] = new MystikoContract(contractConfig);
        promises.push(this.pool[chainId][contractConfig.address].connect(provider, contractGenerator));
        if (contractConfig.assetType !== AssetType.MAIN) {
          if (!contractGenerator) {
            contractGenerator = (address, abi, provider) => new ethers.Contract(address, abi, provider);
          }
          this.assetPool[chainId][contractConfig.assetAddress] = contractGenerator(
            contractConfig.assetAddress,
            erc20Abi,
            provider,
          );
        }
      });
    });
    await Promise.all(promises);
  }

  getDepositContracts(srcChainId, dstChainId, assetSymbol, bridge) {
    const contractConfig = this.config.getContractConfig(srcChainId, dstChainId, assetSymbol, bridge);
    const protocolContract = this.pool[srcChainId][contractConfig.address].contract;
    if (contractConfig.assetType === AssetType.ERC20) {
      const assetContract = this.assetPool[srcChainId][contractConfig.assetAddress];
      return { protocol: protocolContract, asset: assetContract };
    }
    return { protocol: protocolContract };
  }

  getContract(chainId, contractAddress) {
    if (this.pool[chainId] && this.pool[chainId][contractAddress]) {
      return this.pool[chainId][contractAddress].contract;
    }
    return undefined;
  }
}
