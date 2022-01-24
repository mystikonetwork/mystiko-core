import { ethers } from 'ethers';
import { ContractConfig, MystikoConfig } from '../config';
import { ProviderPool } from './provider.js';
import { check } from '../utils.js';
import { MystikoABI } from './abi.js';
import { AssetType } from '../model';

/**
 * @external external:Contract
 * @see {@link https://docs.ethers.io/v5/api/contract ethers.Contract}
 */

/**
 * @external external:Provider
 * @see {@link https://docs.ethers.io/v5/api/providers/provider Provider}
 */
/**
 * @external external:Signer
 * @see {@link https://docs.ethers.io/v5/api/signer Signer}
 */
/**
 * @external external:Wallet
 * @see {@link https://docs.ethers.io/v5/api/signer/#Wallet Wallet}
 */
/**
 * @class MystikoContract
 * @param {ContractConfig} contract configuration of this contract.
 * @desc a wrapped contract object with {@link external:Contract} and
 * ContractConfig.
 */
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

  /**
   * @desc connect this contract with given provider or signer.
   * @param {external:Provider|external:Signer} providerOrSigner an instance of
   * {@link external:Provider} or {@link external:Signer}.
   * @param {Function} [contractGenerator] for constructing smart contract instance,
   * if not provided, it will generate {@link external:Contract}.
   * @returns {external:Contract} constructed {@link external:Contract}.
   */
  connect(providerOrSigner, contractGenerator = undefined) {
    if (!contractGenerator) {
      contractGenerator = (address, abi, providerOrSigner) => {
        return new ethers.Contract(address, abi, providerOrSigner);
      };
    }
    if (this.contract) {
      return this.contract.connect(providerOrSigner);
    } else {
      this.contract = contractGenerator(this.config.address, this.config.abi, providerOrSigner);
      return this.contract;
    }
  }
}

/**
 * @class ContractPool
 * @param {MystikoConfig} config full configuration as {@link MystikoConfig}.
 * @param {ProviderPool} providerPool pool of JSON-RPC providers.
 * @desc a pool wrapped Mystiko contracts from different blockchains.
 */
export class ContractPool {
  constructor(config, providerPool) {
    check(config instanceof MystikoConfig, 'config should be instance of MystikoConfig');
    check(providerPool instanceof ProviderPool, 'providerPool should be instance of ProviderPool');
    this.config = config;
    this.providerPool = providerPool;
    this.pool = {};
    this.assetPool = {};
  }

  /**
   * @desc setting up pool of smart contracts, with all contracts connected.
   * @param {Function} [contractGenerator] for constructing smart contract instance, if not provided,
   * it will generate {@link external:Contract}.
   */
  connect(contractGenerator = undefined) {
    this.config.chains.forEach((chainConfig) => {
      const chainId = chainConfig.chainId;
      if (!this.pool[chainId]) {
        this.pool[chainId] = {};
        this.assetPool[chainId] = {};
      }
      const provider = this.providerPool.getProvider(chainId);
      chainConfig.contracts.forEach((contractConfig) => {
        this.pool[chainId][contractConfig.address] = new MystikoContract(contractConfig);
        this.pool[chainId][contractConfig.address].connect(provider, contractGenerator);
        if (contractConfig.assetType !== AssetType.MAIN) {
          if (!contractGenerator) {
            contractGenerator = (address, abi, provider) => new ethers.Contract(address, abi, provider);
          }
          this.assetPool[chainId][contractConfig.assetAddress] = contractGenerator(
            contractConfig.assetAddress,
            MystikoABI.ERC20,
            provider,
          );
        }
      });
    });
  }

  /**
   * @desc get required smart contracts for a deposit operation
   * with given parameters. Check {@link MystikoConfig#getContractConfig} for more information.
   * @param {number} srcChainId chain id of the source blockchain(from chain).
   * @param {number} dstChainId chain id of the destination blockchain(to chain).
   * @param {string} assetSymbol symbol of the asset. E.g. ETH/USDT/BNB
   * @param {module:mystiko/models.BridgeType} bridge the type of cross-chain bridge.
   * @returns {{protocol: external:Contract, asset: external:Contract}|{protocol: external:Contract}}
   * an object contains protocol contract and asset contract if the asset is not main asset, otherwise
   * the asset contract is undefined.
   */
  getDepositContracts(srcChainId, dstChainId, assetSymbol, bridge) {
    const contractConfig = this.config.getContractConfig(srcChainId, dstChainId, assetSymbol, bridge);
    const protocolContract = this.pool[srcChainId][contractConfig.address].contract;
    if (contractConfig.assetType === AssetType.ERC20) {
      const assetContract = this.assetPool[srcChainId][contractConfig.assetAddress];
      return { protocol: protocolContract, asset: assetContract };
    }
    return { protocol: protocolContract };
  }

  /**
   * get contract for given chain id and contract address.
   * @param {number} chainId chain id of the chain being queried.
   * @param {string} contractAddress address of the smart contract being queried.
   * @returns {external:Contract|undefined} {@link external:Contract} object if it exists in the pool,
   * otherwise it returns undefined.
   */
  getContract(chainId, contractAddress) {
    if (this.pool[chainId] && this.pool[chainId][contractAddress]) {
      return this.pool[chainId][contractAddress].contract;
    }
    return undefined;
  }
}
