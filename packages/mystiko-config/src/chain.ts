import { ethers } from 'ethers';
import { check, toHex, ProviderConnection } from '@mystikonetwork/utils';
import { BaseConfig, BridgeType } from './base';
import { ContractConfig, RawContractConfig } from './contract';

export const EXPLORER_TX_PLACEHOLDER: string = '%tx%';
export const EXPLORER_DEFAULT_PREFIX: string = `/tx/${EXPLORER_TX_PLACEHOLDER}`;

export interface RawChainConfig {
  chainId: number;
  name: string;
  assetSymbol: string;
  assetDecimals: number | undefined;
  explorerUrl: string;
  explorerPrefix: string;
  providers: Array<string | ProviderConnection>;
  signerEndpoint: string;
  contracts: RawContractConfig[];
  wrappedContracts: ContractConfig[];
  syncSize?: number;
}

/**
 * @class ChainConfig
 * @extends BaseConfig
 * @param {any} rawConfig raw configuration object.
 * @desc configuration class for blockchain network.
 */
export class ChainConfig extends BaseConfig {
  private readonly contractByAddress: { [key: string]: ContractConfig };

  constructor(rawConfig: any) {
    super(rawConfig);
    BaseConfig.checkNumber(this.config, 'chainId');
    BaseConfig.checkString(this.config, 'name');
    BaseConfig.checkString(this.config, 'assetSymbol');
    BaseConfig.checkNumber(this.config, 'assetDecimals', false);
    BaseConfig.checkString(this.config, 'explorerUrl');
    BaseConfig.checkString(this.config, 'explorerPrefix', false);
    if (!this.explorerPrefix) {
      this.asRawChainConfig().explorerPrefix = EXPLORER_DEFAULT_PREFIX;
    } else {
      check(this.explorerPrefix.indexOf(EXPLORER_TX_PLACEHOLDER) !== -1, 'not a valid prefix template');
    }
    BaseConfig.checkArray(this.config, 'providers');
    this.checkProviders();
    check(this.providers.length > 0, 'providers cannot be empty');
    BaseConfig.checkString(this.config, 'signerEndpoint');
    BaseConfig.checkObjectArray(this.config, 'contracts');
    this.contractByAddress = {};
    this.asRawChainConfig().wrappedContracts = this.asRawChainConfig().contracts.map((contract) => {
      const contractConfig = new ContractConfig(contract);
      this.contractByAddress[contractConfig.address] = contractConfig;
      return contractConfig;
    });
    BaseConfig.checkNumber(this.config, 'syncSize', false);
  }

  /**
   * @property {number} chainId
   * @desc the chain id of this configured blockchain network.
   */
  public get chainId(): number {
    return this.asRawChainConfig().chainId;
  }

  /**
   * @property {string} name
   * @desc the name of this configured blockchain network.
   */
  public get name(): string {
    return this.asRawChainConfig().name;
  }

  /**
   * @property {string} assetSymbol
   * @desc the main asset symbol of this configured blockchain network.
   */
  public get assetSymbol(): string {
    return this.asRawChainConfig().assetSymbol;
  }

  /**
   * @property {number} assetDecimals
   * @desc the main asset decimals of this configured blockchain network.
   */
  public get assetDecimals(): number {
    const rawConfig = this.asRawChainConfig();
    return rawConfig.assetDecimals ? rawConfig.assetDecimals : 18;
  }

  /**
   * @property {string} explorerUrl
   * @desc the base explorer URL of this configured blockchain network.
   */
  public get explorerUrl(): string {
    return this.asRawChainConfig().explorerUrl;
  }

  /**
   * @property {string} explorerPrefix
   * @desc the explorer's transaction URI template of this configured blockchain network.
   */
  public get explorerPrefix(): string {
    return this.asRawChainConfig().explorerPrefix;
  }

  /**
   * @desc get full explorer URL with given transaction hash.
   * @param {string} txHash hash of the querying transaction.
   * @returns {string} full explorer URL.
   */
  public getTxUrl(txHash: string): string {
    return `${this.explorerUrl}${this.explorerPrefix.replace(EXPLORER_TX_PLACEHOLDER, toHex(txHash))}`;
  }

  /**
   * @property {string[]} providers
   * @desc the array of this configured blockchain's JSON-RPC providers.
   */
  public get providers(): Array<ProviderConnection | string> {
    return this.asRawChainConfig().providers;
  }

  /**
   * For configuring Signer when network configuration does not exist.
   */
  public get signerEndpoint(): string {
    return this.asRawChainConfig().signerEndpoint;
  }

  /**
   * @property {ContractConfig[]} contracts
   * @desc the array of this configured blockchain's supported contract configurations.
   */
  public get contracts(): ContractConfig[] {
    return this.asRawChainConfig().wrappedContracts;
  }

  /**
   * @property {string[]} contractAddresses
   * @desc the array of this configured blockchain's supported contract addresses.
   */
  public get contractAddresses(): string[] {
    return Object.keys(this.contractByAddress);
  }

  /**
   * @property {number[]} peerChainIds
   * @desc the array of this configured blockchain's supported peer chain ids.
   */
  public get peerChainIds(): number[] {
    const chainIds: { [key: number]: number } = {};
    this.contractAddresses.forEach((address) => {
      const contract = this.getContract(address);
      if (contract) {
        if (contract.bridgeType === BridgeType.LOOP) {
          chainIds[this.chainId] = this.chainId;
        } else if (contract.peerChainId) {
          chainIds[contract.peerChainId] = contract.peerChainId;
        }
      }
    });
    return Object.values(chainIds);
  }

  /**
   * @desc get the array of supported asset symbols for the given peer chain id.
   * @param {number} peerChainId peer chain id
   * @param {function} [contractFilter] filter for filter out some contracts.
   * @returns {string[]} the array of asset symbols.
   */
  public getAssetSymbols(
    peerChainId: number,
    contractFilter?: (config?: ContractConfig) => boolean,
  ): string[] {
    const symbols: { [key: string]: boolean } = {};
    this.contractAddresses
      .filter((address) => {
        const contract = this.getContract(address);
        if (contractFilter) {
          return contractFilter(contract);
        }
        return !!contract;
      })
      .forEach((address) => {
        const contract = this.getContract(address);
        if (contract) {
          if (contract.bridgeType === BridgeType.LOOP && this.chainId === peerChainId) {
            symbols[contract.assetSymbol] = true;
          } else if (contract.peerChainId === peerChainId) {
            symbols[contract.assetSymbol] = true;
          }
        }
      });
    return Object.keys(symbols);
  }

  /**
   * @desc get maximum number of blocks every sync queries. If it is undefined, it means there's no limit
   */
  public get syncSize(): number {
    return this.asRawChainConfig().syncSize || 200000;
  }

  /**
   * @desc get the contract configuration with the given address.
   * @param {string} address the address of contract.
   * @returns {ContractConfig} the contract config instance.
   */
  public getContract(address: string): ContractConfig | undefined {
    check(ethers.utils.isAddress(address), `${address} is invalid address`);
    return this.contractByAddress[address];
  }

  public getContractTopicSyncSize(address: string, topic: string): number {
    const contractConfig = this.getContract(address);
    if (contractConfig) {
      return contractConfig.getSyncSize(topic) || this.syncSize;
    }
    return this.syncSize;
  }

  private asRawChainConfig(): RawChainConfig {
    return this.config as RawChainConfig;
  }

  private checkProviders() {
    this.providers.forEach((provider) => {
      if (typeof provider !== 'string') {
        check(!!provider.url, 'url cannot be empty');
      }
    });
  }
}
