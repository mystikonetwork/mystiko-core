import { ethers } from 'ethers';
import { AssetType, BridgeType, ContractConfig } from '../config/contractConfig.js';
import { MystikoConfig } from '../config';
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
      if (abi instanceof Object) {
        check(abi['abi'] && abi['abi'] instanceof Array, 'the json does not have abi array');
        abi = abi.abi;
      }
      check(abi, 'failed to get abi information from ' + this.config.abiFile);
      const contract = contractGenerator(this.config.address, abi, providerOrSigner);
      await this._validContract(contract);
      this.contract = contract;
      return this.contract;
    }
  }

  async _validContract(contract) {
    if (this.config) {
      check(contract.address === this.config.address, 'address does not match');
      const assetType = await contract.assetType();
      check(assetType === this.config.assetType, 'asset type does not match');
      const bridgeType = await contract.bridgeType();
      check(bridgeType === this.config.bridgeType, 'bridge type does not match');
      if (assetType !== AssetType.MAIN) {
        const asset = await contract.asset();
        check(asset === this.config.assetAddress, 'asset address does not match');
        const assetSymbol = await contract.assetSymbol();
        check(assetSymbol === this.config.assetSymbol, 'asset symbol does not match');
        const assetDecimals = await contract.assetDecimals();
        check(assetDecimals === this.config.assetDecimals, 'asset decimals does not match');
      }
      if (bridgeType !== BridgeType.LOOP) {
        const peerChainId = await contract.peerChainId();
        check(peerChainId === this.config.peerChainId, 'peerChainId does not match');
        const peerContractAddress = await contract.peerContractAddress();
        check(peerContractAddress === this.config.peerContractAddress, 'peerContractAddress does not match');
      }
    }
  }
}

export class ContractPool {
  constructor(config) {
    check(config instanceof MystikoConfig, 'config should be instance of MystikoConfig');
    this.config = config;
    this.pool = {};
    this.assetPool = {};
  }

  async connect(contractGenerator = undefined) {
    const providerGenerator = (rpcEndpoints) => {
      const jsonRpcProviders = rpcEndpoints.map((rpcEndpoint) => {
        return new ethers.providers.JsonRpcProvider(rpcEndpoint);
      });
      return new ethers.providers.FallbackProvider(jsonRpcProviders);
    };
    const promises = [];
    this.config.chainIds.forEach((chainId) => {
      if (!this.pool[chainId]) {
        this.pool[chainId] = {};
        this.assetPool[chainId] = {};
      }
      const chainConfig = this.config.getChainConfig(chainId);
      chainConfig.contracts.forEach((contractConfig) => {
        this.pool[chainId][contractConfig.address] = new MystikoContract(contractConfig);
        const provider = providerGenerator(chainConfig.providers);
        promises.push(this.pool[chainId][contractConfig.address].connect(provider, contractGenerator));
        if (contractConfig.assetType !== AssetType.MAIN) {
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

  getWithdrawContract(srcChainId, dstChainId, assetSymbol, bridge) {
    const contractConfig = this.config.getContractConfig(srcChainId, dstChainId, assetSymbol, bridge);
    if (contractConfig.bridgeType === BridgeType.LOOP) {
      return this.pool[srcChainId][contractConfig.address].contract;
    } else {
      return this.pool[dstChainId][contractConfig.peerContractAddress].contract;
    }
  }
}
