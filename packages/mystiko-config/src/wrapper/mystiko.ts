import { check } from '@mystikonetwork/utils';
import { BaseConfig } from './base';
import { RawCelerBridgeConfig, RawConfig, RawMystikoConfig, RawPolyBridgeConfig } from '../raw';
import { CircuitConfig } from './circuit';
import { ChainConfig } from './chain';
import { CelerBridgeConfig, PolyBridgeConfig, TBridgeConfig } from './bridge';
import { BridgeType, CircuitType } from '../common';
import { DepositContractConfig, PoolContractConfig } from './contract';
import defaultClientTestnetConfig from '../json/client/default/testnet.json';
import defaultClientMainnetConfig from '../json/client/default/mainnet.json';

export type BridgeConfigType = CelerBridgeConfig | PolyBridgeConfig | TBridgeConfig;

export class MystikoConfig extends BaseConfig<RawMystikoConfig> {
  private readonly defaultCircuitConfigs: Map<CircuitType, CircuitConfig>;

  private readonly circuitConfigsByName: Map<string, CircuitConfig>;

  private readonly bridgeConfigs: Map<BridgeType, BridgeConfigType>;

  private readonly chainConfigs: Map<number, ChainConfig>;

  protected constructor(data: RawMystikoConfig) {
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

  public getDepositContractConfigByAddress(
    chainId: number,
    address: string,
  ): DepositContractConfig | undefined {
    return this.getChainConfig(chainId)?.getDepositContractByAddress(address);
  }

  public getPoolContractConfig(
    chainId: number,
    assetSymbol: string,
    bridgeType: BridgeType,
  ): PoolContractConfig | undefined {
    return this.getChainConfig(chainId)?.getPoolContract(assetSymbol, bridgeType);
  }

  public getPoolContractConfigByAddress(chainId: number, address: string): PoolContractConfig | undefined {
    return this.getChainConfig(chainId)?.getPoolContractByAddress(address);
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

  public getTransactionUrl(chainId: number, transactionHash: string): string | undefined {
    return this.getChainConfig(chainId)?.getTransactionUrl(transactionHash);
  }

  public mutate(data?: RawMystikoConfig): MystikoConfig {
    return new MystikoConfig(data || this.data);
  }

  public static createFromFile(jsonFile: string): Promise<MystikoConfig> {
    return RawConfig.createFromFile(RawMystikoConfig, jsonFile).then((raw) => new MystikoConfig(raw));
  }

  public static createFromRaw(raw: RawMystikoConfig): Promise<MystikoConfig> {
    return raw.validate().then(() => new MystikoConfig(raw));
  }

  public static createFromPlain(plain: Object): Promise<MystikoConfig> {
    return RawConfig.createFromObject(RawMystikoConfig, plain).then((raw) =>
      MystikoConfig.createFromRaw(raw),
    );
  }

  public static createDefaultTestnetConfig(): Promise<MystikoConfig> {
    return MystikoConfig.createFromPlain(defaultClientTestnetConfig);
  }

  public static createDefaultMainnetConfig(): Promise<MystikoConfig> {
    return MystikoConfig.createFromPlain(defaultClientMainnetConfig);
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
      circuitConfigsByName.set(circuitConfig.name, circuitConfig);
    });
    let hasPoolContracts = false;
    for (let i = 0; i < this.data.chains.length; i += 1) {
      const rawChainConfig = this.data.chains[i];
      if (rawChainConfig.poolContracts.length > 0) {
        hasPoolContracts = true;
        break;
      }
    }
    if (hasPoolContracts) {
      Object.values(CircuitType).forEach((circuitType) => {
        check(
          defaultCircuitConfigs.has(circuitType),
          `missing definition of default circuit type=${circuitType}`,
        );
      });
    }
    return { defaultCircuitConfigs, circuitConfigsByName };
  }

  private initBridgeConfigs(): Map<BridgeType, BridgeConfigType> {
    const bridgeConfigs = new Map<BridgeType, BridgeConfigType>();
    this.data.bridges.forEach((raw) => {
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
      chainConfigs.set(
        raw.chainId,
        new ChainConfig(raw, {
          defaultCircuitConfigs,
          circuitConfigsByName,
          depositContractGetter: (chainId, address) =>
            this.getDepositContractConfigByAddress(chainId, address),
        }),
      );
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
          if (depositContractConfig.peerChainId && depositContractConfig.peerContractAddress) {
            const peerChainConfig = this.chainConfigs.get(depositContractConfig.peerChainId);
            if (!peerChainConfig) {
              throw new Error(
                `no corresponding peer chain id=${depositContractConfig.peerChainId} ` +
                  `definition for deposit contract ${depositContractConfig.address} ` +
                  'peer chain configuration',
              );
            }
            const peerDepositContractConfig = peerChainConfig.getDepositContractByAddress(
              depositContractConfig.peerContractAddress,
            );
            if (!peerDepositContractConfig) {
              throw new Error(
                `no corresponding peer deposit contract chain id=${depositContractConfig.peerChainId} ` +
                  `and address=${depositContractConfig.peerContractAddress} definition for deposit contract` +
                  ` address=${depositContractConfig.address} peer chain configuration`,
              );
            }
            check(
              peerDepositContractConfig.bridgeType === depositContractConfig.bridgeType,
              `bridge type mismatch for chain id=${depositContractConfig.peerChainId} ` +
                `address=${depositContractConfig.peerContractAddress} vs chain id=${chainConfig.chainId} ` +
                `and address=${depositContractConfig.address}`,
            );
            check(
              peerDepositContractConfig.peerChainId === chainConfig.chainId &&
                peerDepositContractConfig.peerContractAddress === depositContractConfig.address,
              `chain id=${peerDepositContractConfig.peerChainId} and ` +
                `address=${peerDepositContractConfig.peerContractAddress} ` +
                `does not match chain id=${chainConfig.chainId} and ` +
                `address=${depositContractConfig.address} configured`,
            );
          }
        }
      });
    });
  }
}
