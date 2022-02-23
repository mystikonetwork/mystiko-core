import { check, readJsonFile } from '@mystiko/utils';
import { BaseConfig, BridgeType } from './base';
import { ChainConfig, RawChainConfig } from './chain';
import { BaseBridgeConfig, createBridgeConfig, RawBaseBridgeConfig } from './bridge';
import { CircuitConfig, RawCircuitConfig } from './circuit';
import { ContractConfig } from './contract';

export interface RawMystikoConfig {
  version: string;
  chains: RawChainConfig[];
  bridges: RawBaseBridgeConfig[];
  circuits: RawCircuitConfig[];
  wrappedChains: { [key: number]: ChainConfig };
  wrappedBridges: { [key: string]: BaseBridgeConfig };
  wrappedCircuits: { [key: string]: CircuitConfig };
}

/**
 * @class MystikoConfig
 * @extends BaseConfig
 * @param {Object} rawConfig raw configuration object.
 * @desc configuration class for this library.
 */
export class MystikoConfig extends BaseConfig {
  constructor(rawConfig: any) {
    super(rawConfig);
    BaseConfig.checkString(this.config, 'version');
    BaseConfig.checkObjectArray(this.config, 'chains', false);
    BaseConfig.checkObjectArray(this.config, 'bridges', false);
    BaseConfig.checkObjectArray(this.config, 'circuits', false);
    this.createChainConfigs();
    this.createBridgeConfigs();
    this.createCircuitConfigs();
    this.validateConfig();
  }

  /**
   * @property {string} version
   * @desc version of current configuration.
   */
  public get version(): string {
    return this.asRawMystikoConfig().version;
  }

  /**
   * @property {ChainConfig[]} chains
   * @desc an array of current configured blockchain networks.
   */
  public get chains(): ChainConfig[] {
    return Object.values(this.asRawMystikoConfig().wrappedChains);
  }

  /**
   * @property {CircuitConfig[]} circuits
   * @desc an array of configured zero knowledge proof related resources.
   */
  public get circuits(): CircuitConfig[] {
    return Object.values(this.asRawMystikoConfig().wrappedCircuits);
  }

  /**
   * @desc get the configuration of blockchain with given chainId.
   * @param {number} chainId blockchain's chainId @see {@link https://chainlist.org/ ChainList}.
   * @returns {ChainConfig} the config object of given blockchain. It returns undefined,
   * if given chainId is not configured.
   */
  public getChainConfig(chainId: number): ChainConfig {
    return this.asRawMystikoConfig().wrappedChains[chainId];
  }

  /**
   * @desc get the supported peer chain configurations of the given chainId.
   * @param {number} chainId blockchain's chainId @see {@link https://chainlist.org/ ChainList}.
   * @returns {ChainConfig[]} an array of peer chain's configurations. It returns an empty array,
   * if no peer chains are configured for given chainId.
   */
  public getPeerChains(chainId: number): ChainConfig[] {
    const chainConfig = this.getChainConfig(chainId);
    if (chainConfig) {
      return chainConfig.peerChainIds.map((peerChainId) => this.getChainConfig(peerChainId));
    }
    return [];
  }

  /**
   * @desc get the array of supported asset symbols with given source chain id and destination chain id.
   * @param {number} srcChainId chain id of the source blockchain(from chain).
   * @param {number} dstChainId chain id of the destination blockchain(to chain).
   * @returns {string[]} an array of supported asset symbols. It returns an empty array,
   * if no configured asset symbols are found for given srcChainId and dstChainId.
   */
  public getAssetSymbols(srcChainId: number, dstChainId: number): string[] {
    const chainConfig = this.getChainConfig(srcChainId);
    if (chainConfig) {
      return chainConfig.getAssetSymbols(dstChainId);
    }
    return [];
  }

  /**
   * @desc get the array of supported cross-chain bridges with given source chain id, destination chain id and
   * the symbol of asset.
   * @param {number} srcChainId chain id of the source blockchain(from chain).
   * @param {number} dstChainId chain id of the destination blockchain(to chain).
   * @param {string} assetSymbol symbol of the asset. E.g. ETH/USDT/BNB
   * @returns {BaseBridgeConfig[]} an array of supported cross-chain bridges. It returns an empty array,
   * if no configured cross-chain bridges are found for given srcChainId, dstChainId and assetSymbol.
   * If srcChainId === dstChainId, it returns an empty array, because in this situation, it does not need a
   * cross-chain bridge.
   */
  public getBridges(srcChainId: number, dstChainId: number, assetSymbol: string): BaseBridgeConfig[] {
    const bridges: { [key: string]: BaseBridgeConfig } = {};
    if (srcChainId !== dstChainId) {
      const chainConfig = this.getChainConfig(srcChainId);
      if (chainConfig) {
        chainConfig.contracts.forEach((contractConfig) => {
          if (dstChainId === contractConfig.peerChainId && assetSymbol === contractConfig.assetSymbol) {
            bridges[contractConfig.bridgeType] = this.getBridgeConfig(contractConfig.bridgeType);
          }
        });
      }
    }
    return Object.values(bridges);
  }

  /**
   * @desc get the configuration of given cross-chain bridge.
   * @param {BridgeType} bridgeType the type of cross-chain bridge.
   * @returns {BaseBridgeConfig} configuration of the specified cross-chain bridge.
   */
  public getBridgeConfig(bridgeType: BridgeType): BaseBridgeConfig {
    check(Object.values(BridgeType).includes(bridgeType), 'invalid bridge type');
    return this.asRawMystikoConfig().wrappedBridges[bridgeType];
  }

  /**
   * @desc get the configuration of the given combination of source chain id, destination chain id,
   * asset symbol and cross-chain bridge. This method is useful for detecting the contract for the given
   * user inputs.
   * @param {number} srcChainId chain id of the source blockchain(from chain).
   * @param {number} dstChainId chain id of the destination blockchain(to chain).
   * @param {string} assetSymbol symbol of the asset. E.g. ETH/USDT/BNB
   * @param {BridgeType} bridge the type of cross-chain bridge.
   * @returns {ContractConfig} the found configuration of the contract.
   * @throws {Error} if no configured contracts satisfy the given inputs.
   */
  public getContractConfig(
    srcChainId: number,
    dstChainId: number,
    assetSymbol: string,
    bridge: BridgeType,
  ): ContractConfig {
    if (srcChainId === dstChainId) {
      check(bridge === BridgeType.LOOP, 'equal chain ids should have loop bridge');
    } else {
      check(
        Object.values(BridgeType).includes(bridge) && bridge !== BridgeType.LOOP,
        `${bridge} is invalid bridge type`,
      );
    }
    const srcChainConfig = this.asRawMystikoConfig().wrappedChains[srcChainId];
    check(!!srcChainConfig, `chain ${srcChainId} does not exist in config`);
    for (let i = 0; i < srcChainConfig.contracts.length; i += 1) {
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

  /**
   * @desc get the configuration of zero knowledge proof resources with given scheme name.
   * @param {string} name name of supported zkp scheme.
   * @returns {CircuitConfig} configuration of zkp scheme.
   */
  public getCircuitConfig(name: string): CircuitConfig {
    return this.asRawMystikoConfig().wrappedCircuits[name];
  }

  /**
   * Get transaction's explorer URL based on chainId.
   * @param {number} chainId the chain id of where this transaction was confirmed.
   * @param {string|undefined} transactionHash the hash of the transaction, if it is undefined,
   * this method returns undefined.
   * @returns {string|undefined} a full explorer URL if all information is available, otherwise it returns undefined.
   */
  public getChainTxExplorerUrl(chainId: number, transactionHash: string): string | undefined {
    if (transactionHash) {
      const chainConfig = this.getChainConfig(chainId);
      if (chainConfig) {
        return chainConfig.getTxUrl(transactionHash);
      }
    }
    return undefined;
  }

  /**
   * @desc get the explorer URL of transaction in cross-chain bridges, if it is available.
   * @param {BridgeType} bridgeType type of the cross-chain bridge.
   * @param {string|undefined} transactionHash hash of the transaction confirmed on the cross-chain bridge. if none,
   * this method returns undefined.
   * @returns {string|undefined} a full explorer URL if all information is available, otherwise it returns undefined.
   */
  public getBridgeTxExplorerUrl(bridgeType: BridgeType, transactionHash: string): string | undefined {
    if (transactionHash) {
      check(Object.values(BridgeType).includes(bridgeType), `${bridgeType} is an invalid bridge type`);
      const bridgeConfig = this.getBridgeConfig(bridgeType);
      if (bridgeConfig && 'getTxUrl' in bridgeConfig) {
        // @ts-ignore
        return bridgeConfig.getTxUrl(transactionHash);
      }
    }
    return undefined;
  }

  private createChainConfigs() {
    const rawConfig = this.asRawMystikoConfig();
    rawConfig.wrappedChains = {};
    if (rawConfig.chains) {
      rawConfig.chains.forEach((rawChainConfig) => {
        const conf = new ChainConfig(rawChainConfig);
        check(!rawConfig.wrappedChains[conf.chainId], 'duplicate chain config');
        rawConfig.wrappedChains[conf.chainId] = conf;
      });
    }
  }

  private createBridgeConfigs() {
    const rawConfig = this.asRawMystikoConfig();
    rawConfig.wrappedBridges = {};
    if (rawConfig.bridges) {
      rawConfig.bridges.forEach((rawBridgeConfig) => {
        const conf = createBridgeConfig(rawBridgeConfig);
        check(!rawConfig.wrappedBridges[conf.type], 'duplicate bridge config');
        rawConfig.wrappedBridges[conf.type] = conf;
      });
    }
  }

  private createCircuitConfigs() {
    const rawConfig = this.asRawMystikoConfig();
    rawConfig.wrappedCircuits = {};
    if (rawConfig.circuits) {
      rawConfig.circuits.forEach((rawCircuitConfig) => {
        const conf = new CircuitConfig(rawCircuitConfig);
        check(!rawConfig.wrappedCircuits[conf.name], 'duplicate circuit config');
        rawConfig.wrappedCircuits[conf.name] = conf;
      });
    }
  }

  private validateConfig() {
    const rawConfig = this.asRawMystikoConfig();
    this.chains.forEach((chainConfig) => {
      chainConfig.contracts.forEach((contract) => {
        if (contract.bridgeType !== BridgeType.LOOP) {
          check(!!rawConfig.wrappedBridges[contract.bridgeType], `no bridge ${contract.bridgeType} config`);
          if (contract.peerChainId) {
            check(!!contract.peerContractAddress, 'peerContractAddress should be exist');
            check(!!rawConfig.wrappedChains[contract.peerChainId], 'non-exist peerChainId');
            const peerChain = rawConfig.wrappedChains[contract.peerChainId];
            if (contract.peerContractAddress) {
              check(!!peerChain.getContract(contract.peerContractAddress), 'non-exist peerChainContract');
              const peerContract = peerChain.getContract(contract.peerContractAddress);
              check(peerContract.bridgeType === contract.bridgeType, 'bridge type does not match');
              check(peerContract.assetDecimals === contract.assetDecimals, 'token decimals does not match');
              check(peerContract.peerChainId === chainConfig.chainId, 'chain id does not match');
              check(peerContract.peerContractAddress === contract.address, 'contract address does not match');
            }
          }
        }
        check(
          !!this.getCircuitConfig(contract.circuits),
          `circuits version ${contract.circuits} is not configured`,
        );
      });
    });
  }

  private asRawMystikoConfig(): RawMystikoConfig {
    return this.config as RawMystikoConfig;
  }
}

/**
 * @function module:mystiko/config.readFromFile
 * @param {string} configFile file name of the configuration. It could be a URL or file system's path.
 * @returns {Promise<MystikoConfig>}
 */
export async function readFromFile(configFile: string): Promise<MystikoConfig> {
  const rawConfig = await readJsonFile(configFile);
  return new MystikoConfig(rawConfig);
}
