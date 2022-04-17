import { check } from '@mystikonetwork/utils';
import { BaseConfig } from './base';
import { RawCelerBridgeConfig, RawMystikoConfig, RawPolyBridgeConfig } from '../raw';
import { CircuitConfig } from './circuit';
import { ChainConfig } from './chain';
import { CelerBridgeConfig, PolyBridgeConfig, TBridgeConfig } from './bridge';
import { BridgeType, CircuitType, readRawConfigFromFile } from '../common';
import { DepositContractConfig, PoolContractConfig } from './contract';

export type BridgeConfigType = CelerBridgeConfig | PolyBridgeConfig | TBridgeConfig;

export class MystikoConfig extends BaseConfig<RawMystikoConfig> {
  private readonly defaultCircuitConfigs: Map<CircuitType, CircuitConfig>;

  private readonly circuitConfigsByName: Map<string, CircuitConfig>;

  private readonly bridgeConfigs: Map<BridgeType, BridgeConfigType>;

  private readonly chainConfigs: Map<number, ChainConfig>;

  constructor(data: RawMystikoConfig) {
    super(data);
    const { defaultCircuitConfigs, circuitConfigsByName } = this.initCircuitConfigs();
    this.defaultCircuitConfigs = defaultCircuitConfigs;
    this.circuitConfigsByName = circuitConfigsByName;
    this.bridgeConfigs = this.initBridgeConfigs();
    this.chainConfigs = this.initChainConfigs(defaultCircuitConfigs, circuitConfigsByName);
    this.validate();
  }

  public get version(): string {
    return this.data.version;
  }

  public get circuits(): CircuitConfig[] {
    return Array.from(this.circuitConfigsByName.values());
  }

  public get bridges(): Array<BridgeConfigType> {
    return Array.from(this.bridgeConfigs.values());
  }

  public get chains(): ChainConfig[] {
    return Array.from(this.chainConfigs.values());
  }

  public getChainConfig(chainId: number): ChainConfig | undefined {
    return this.chainConfigs.get(chainId);
  }

  public getPeerChainConfigs(chainId: number): ChainConfig[] {
    const peerChainConfigs: ChainConfig[] = [];
    const chainConfig = this.getChainConfig(chainId);
    if (chainConfig) {
      chainConfig.peerChainIds.forEach((peerChainId) => {
        const peerChainConfig = this.getChainConfig(peerChainId);
        if (peerChainConfig) {
          peerChainConfigs.push(peerChainConfig);
        }
      });
    }
    return peerChainConfigs;
  }

  public getAssetSymbols(chainId: number, peerChainId: number): string[] {
    return this.getChainConfig(chainId)?.getAssetSymbols(peerChainId) || [];
  }

  public getBridges(chainId: number, peerChainId: number, assetSymbol: string): BridgeConfigType[] {
    const bridges: BridgeConfigType[] = [];
    const chainConfig = this.getChainConfig(chainId);
    if (chainConfig) {
      chainConfig.getBridges(peerChainId, assetSymbol).forEach((bridgeType) => {
        const bridgeConfig = this.getBridgeConfig(bridgeType);
        if (bridgeConfig) {
          bridges.push(bridgeConfig);
        }
      });
    }
    return bridges;
  }

  public getDepositContractConfig(
    chainId: number,
    peerChainId: number,
    assetSymbol: string,
    bridgeType: BridgeType,
  ): DepositContractConfig | undefined {
    return this.getChainConfig(chainId)?.getDepositContract(peerChainId, assetSymbol, bridgeType);
  }

  public getPoolContractConfig(
    chainId: number,
    assetSymbol: string,
    bridgeType: BridgeType,
  ): PoolContractConfig | undefined {
    return this.getChainConfig(chainId)?.getPoolContract(assetSymbol, bridgeType);
  }

  public getBridgeConfig(type: BridgeType): BridgeConfigType | undefined {
    return this.bridgeConfigs.get(type);
  }

  public getDefaultCircuitConfig(type: CircuitType): CircuitConfig | undefined {
    return this.defaultCircuitConfigs.get(type);
  }

  public getCircuitConfigByName(name: string): CircuitConfig | undefined {
    return this.circuitConfigsByName.get(name);
  }

  public static readFromFile(jsonFile: string): Promise<MystikoConfig> {
    return readRawConfigFromFile(RawMystikoConfig, jsonFile).then((raw) => new MystikoConfig(raw));
  }

  private initCircuitConfigs() {
    const defaultCircuitConfigs = new Map<CircuitType, CircuitConfig>();
    const circuitConfigsByName = new Map<string, CircuitConfig>();
    this.data.circuits.forEach((raw) => {
      const circuitConfig = new CircuitConfig(raw);
      if (raw.isDefault) {
        check(
          !defaultCircuitConfigs.has(circuitConfig.type),
          `duplicate default circuit type=${circuitConfig.type} definition`,
        );
        defaultCircuitConfigs.set(circuitConfig.type, circuitConfig);
      }
      check(!circuitConfigsByName.has(circuitConfig.name), `duplicate circuit name=${circuitConfig.name}`);
      circuitConfigsByName.set(circuitConfig.name, circuitConfig);
    });
    Object.values(CircuitType).forEach((circuitType) => {
      check(
        defaultCircuitConfigs.has(circuitType),
        `missing definition of default circuit type=${circuitType}`,
      );
    });
    return { defaultCircuitConfigs, circuitConfigsByName };
  }

  private initBridgeConfigs(): Map<BridgeType, BridgeConfigType> {
    const bridgeConfigs = new Map<BridgeType, BridgeConfigType>();
    this.data.bridges.forEach((raw) => {
      check(!bridgeConfigs.has(raw.type), `duplicate bridge type=${raw.type} definition in configuration`);
      if (raw instanceof RawCelerBridgeConfig) {
        bridgeConfigs.set(raw.type, new CelerBridgeConfig(raw));
      } else if (raw instanceof RawPolyBridgeConfig) {
        bridgeConfigs.set(raw.type, new PolyBridgeConfig(raw));
      } else {
        bridgeConfigs.set(raw.type, new TBridgeConfig(raw));
      }
    });
    return bridgeConfigs;
  }

  private initChainConfigs(
    defaultCircuitConfigs: Map<CircuitType, CircuitConfig>,
    circuitConfigsByName: Map<string, CircuitConfig>,
  ): Map<number, ChainConfig> {
    const chainConfigs = new Map<number, ChainConfig>();
    this.data.chains.forEach((raw) => {
      check(!chainConfigs.has(raw.chainId), `duplicate chain id=${raw.chainId} definition in configuration`);
      chainConfigs.set(raw.chainId, new ChainConfig(raw, defaultCircuitConfigs, circuitConfigsByName));
    });
    return chainConfigs;
  }

  private validate() {
    this.chainConfigs.forEach((chainConfig) => {
      chainConfig.depositContractsWithDisabled.forEach((depositContractConfig) => {
        if (depositContractConfig.bridgeType !== BridgeType.LOOP) {
          check(
            this.bridgeConfigs.has(depositContractConfig.bridgeType),
            `bridge type=${depositContractConfig.bridgeType} definition does not exist`,
          );
          depositContractConfig.peerContracts.forEach((peerContractConfig) => {
            check(
              this.chainConfigs.has(peerContractConfig.chainId),
              `no corresponding peer chain id=${peerContractConfig.chainId} ` +
                `definition for deposit contract ${depositContractConfig.address} ` +
                'peer chain configuration',
            );
            const peerDepositContractConfig = this.chainConfigs
              .get(peerContractConfig.chainId)
              ?.getDepositContractByAddress(peerContractConfig.address);
            if (!peerDepositContractConfig) {
              throw new Error(
                `no corresponding peer deposit contract chain id=${peerContractConfig.chainId} ` +
                  `and address=${peerContractConfig.address} definition for deposit contract` +
                  ` address=${depositContractConfig.address} peer chain configuration`,
              );
            }
            check(
              peerDepositContractConfig.bridgeType === depositContractConfig.bridgeType,
              `bridge type mismatch for chain id=${peerContractConfig.chainId} ` +
                `address=${peerContractConfig.address} vs chain id=${chainConfig.chainId} ` +
                `and address=${depositContractConfig.address}`,
            );
            const index = peerDepositContractConfig.peerContracts.findIndex(
              (conf) =>
                conf.chainId === chainConfig.chainId && conf.address === depositContractConfig.address,
            );
            check(
              index >= 0,
              `chain id=${peerContractConfig.chainId} and address=${peerContractConfig.address} ` +
                `does not have expected peer chain id=${chainConfig.chainId} and ` +
                `address=${depositContractConfig.address} configured`,
            );
          });
        }
      });
    });
  }
}
