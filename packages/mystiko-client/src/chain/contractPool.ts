import { ContractInterface, ethers } from 'ethers';
import { AssetType, BridgeType, MystikoABI, MystikoConfig } from '@mystiko/config';
import { ProviderPool } from './provider';
import { Contract } from '../model';
import { MystikoContract } from './contract';

/**
 * @class ContractPool
 * @param {MystikoConfig} config a config instance of {@link MystikoConfig}
 * @param {ProviderPool} providerPool pool of JSON-RPC providers.
 * @desc a pool wrapped Mystiko contracts from different blockchains.
 */
export class ContractPool {
  private readonly config: MystikoConfig;

  private readonly providerPool: ProviderPool;

  private readonly pool: { [key: number]: { [key: string]: MystikoContract } };

  private readonly assetPool: { [key: number]: { [key: string]: ethers.Contract } };

  constructor(config: MystikoConfig, providerPool: ProviderPool) {
    this.config = config;
    this.providerPool = providerPool;
    this.pool = {};
    this.assetPool = {};
  }

  /**
   * @desc setting up pool of smart contracts, with all contracts connected.
   * @param {Contract[]} contracts all supporting contracts.
   * @param {Function} [contractGenerator] for constructing smart contract instance, if not provided,
   * it will generate ethers.Contract.
   */
  public connect(
    contracts: Contract[],
    contractGenerator?: (
      address: string,
      abi: ContractInterface,
      providerOrSigner: ethers.providers.Provider | ethers.Signer,
    ) => ethers.Contract,
  ) {
    contracts.forEach((contractConfig) => {
      if (contractConfig.chainId && contractConfig.address && contractConfig.assetType) {
        if (!this.pool[contractConfig.chainId]) {
          this.pool[contractConfig.chainId] = {};
          this.assetPool[contractConfig.chainId] = {};
        }
        const provider = this.providerPool.getProvider(contractConfig.chainId);
        if (provider) {
          this.pool[contractConfig.chainId][contractConfig.address] = new MystikoContract(contractConfig);
          this.pool[contractConfig.chainId][contractConfig.address].connect(provider, contractGenerator);
          if (contractConfig.assetAddress && contractConfig.assetType !== AssetType.MAIN) {
            let cGenerator: (
              address: string,
              abi: ContractInterface,
              providerOrSigner: ethers.providers.Provider | ethers.Signer,
            ) => ethers.Contract;
            if (!contractGenerator) {
              cGenerator = (address, abi, p) => new ethers.Contract(address, abi, p);
            } else {
              cGenerator = contractGenerator;
            }
            this.assetPool[contractConfig.chainId][contractConfig.assetAddress] = cGenerator(
              contractConfig.assetAddress,
              MystikoABI.ERC20.abi,
              provider,
            );
          }
        }
      }
    });
  }

  /**
   * @desc get required smart contracts for a deposit operation
   * with given parameters. Check {@link MystikoConfig#getContractConfig} for more information.
   * @param {number} srcChainId chain id of the source blockchain(from chain).
   * @param {number} dstChainId chain id of the destination blockchain(to chain).
   * @param {string} assetSymbol symbol of the asset. E.g. ETH/USDT/BNB
   * @param {BridgeType} bridge the type of cross-chain bridge.
   * @returns {{protocol: ethers.Contract, asset: ethers.Contract}|{protocol: ethers.Contract}}
   * an object contains protocol contract and asset contract if the asset is not main asset, otherwise
   * the asset contract is undefined.
   */
  public getDepositContracts(
    srcChainId: number,
    dstChainId: number,
    assetSymbol: string,
    bridge: BridgeType,
  ): { protocol: ethers.Contract; asset: ethers.Contract | undefined } {
    const contractConfig = this.config.getContractConfig(srcChainId, dstChainId, assetSymbol, bridge);
    const protocolContract = this.getContract(srcChainId, contractConfig.address);
    if (protocolContract) {
      if (contractConfig.assetType === AssetType.ERC20 && contractConfig.assetAddress) {
        const assetContract = this.assetPool[srcChainId][contractConfig.assetAddress];
        return { protocol: protocolContract, asset: assetContract };
      }
      return { protocol: protocolContract, asset: undefined };
    }
    throw new Error(`contract ${contractConfig.address} is not connected`);
  }

  /**
   * get contract for given chain id and contract address.
   * @param {number} chainId chain id of the chain being queried.
   * @param {string} contractAddress address of the smart contract being queried.
   * @returns {ethers.Contract|undefined} {@link ethers.Contract} object if it exists in the pool,
   * otherwise it returns undefined.
   */
  public getContract(chainId: number, contractAddress: string): ethers.Contract | undefined {
    const wrappedContract = this.getWrappedContract(chainId, contractAddress);
    return wrappedContract ? wrappedContract.rawContract : undefined;
  }

  /**
   * get contract for given chain id and contract address.
   * @param {number} chainId chain id of the chain being queried.
   * @param {string} contractAddress address of the smart contract being queried.
   * @returns {MystikoContract|undefined} a wrapped contract object if it exists in the pool,
   * otherwise it returns undefined.
   */
  public getWrappedContract(chainId: number, contractAddress: string): MystikoContract | undefined {
    if (this.pool[chainId] && this.pool[chainId][contractAddress]) {
      return this.pool[chainId][contractAddress];
    }
    return undefined;
  }

  public updateWrappedContract(chainId: number, contractAddress: string, contract: MystikoContract) {
    this.pool[chainId][contractAddress] = contract;
  }
}
