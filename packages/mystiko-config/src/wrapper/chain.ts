import { check } from '@mystikonetwork/utils';
import { BaseConfig } from './base';
import { RawChainConfig } from '../raw';
import { DepositContractConfig, PoolContractConfig } from './contract';
import { CircuitConfig } from './circuit';
import { BridgeType, CircuitType } from '../common';
import { ProviderConfig } from './provider';

export class ChainConfig extends BaseConfig<RawChainConfig> {
  private readonly poolContractConfigs: Map<string, PoolContractConfig>;

  private readonly depositContractConfigs: Map<string, DepositContractConfig>;

  private readonly depositConfigsByAssetAndBridge: Map<string, Map<BridgeType, DepositContractConfig>>;

  private readonly providerConfigs: ProviderConfig[];

  constructor(
    data: RawChainConfig,
    defaultCircuitConfigs: Map<CircuitType, CircuitConfig>,
    circuitConfigsByName: Map<string, CircuitConfig>,
  ) {
    super(data);
    this.poolContractConfigs = this.initPoolContractConfigs(defaultCircuitConfigs, circuitConfigsByName);
    this.depositContractConfigs = this.initDepositContractConfigs(this.poolContractConfigs);
    this.depositConfigsByAssetAndBridge = this.initDepositConfigsByAssetAndBridge();
    this.providerConfigs = this.data.providers.map((raw) => new ProviderConfig(raw));
  }

  public get chainId(): number {
    return this.data.chainId;
  }

  public get name(): string {
    return this.data.name;
  }

  public get assetSymbol(): string {
    return this.data.assetSymbol;
  }

  public get assetDecimals(): number {
    return this.data.assetDecimals;
  }

  public get explorerUrl(): string {
    return this.data.explorerUrl;
  }

  public get explorerPrefix(): string {
    return this.data.explorerPrefix;
  }

  public get providers(): Array<ProviderConfig> {
    return this.providerConfigs;
  }

  public get signerEndpoint(): string {
    return this.data.signerEndpoint;
  }

  public get eventFilterSize(): number {
    return this.data.eventFilterSize;
  }

  public get poolContracts(): PoolContractConfig[] {
    return Array.from(this.poolContractConfigs.values());
  }

  public get depositContracts(): DepositContractConfig[] {
    return this.depositContractsWithDisabled.filter((conf) => !conf.disabled);
  }

  public get depositContractsWithDisabled(): DepositContractConfig[] {
    return Array.from(this.depositContractConfigs.values());
  }

  public get peerChainIds(): number[] {
    const chainIds = new Set<number>();
    this.depositContracts.forEach((depositContractConfig) => {
      if (depositContractConfig.bridgeType === BridgeType.LOOP) {
        chainIds.add(this.chainId);
      } else {
        depositContractConfig.peerContracts.forEach((peerContractConfig) => {
          chainIds.add(peerContractConfig.chainId);
        });
      }
    });
    return Array.from(chainIds);
  }

  public getAssetSymbols(peerChainId: number): string[] {
    const assetSymbols: Set<string> = new Set<string>();
    this.depositContracts.forEach((depositContractConfig) => {
      if (peerChainId === this.chainId) {
        if (depositContractConfig.bridgeType === BridgeType.LOOP) {
          assetSymbols.add(depositContractConfig.assetSymbol);
        }
      } else if (depositContractConfig.bridgeType !== BridgeType.LOOP) {
        const index = depositContractConfig.peerContracts.findIndex((conf) => conf.chainId === peerChainId);
        if (index >= 0) {
          assetSymbols.add(depositContractConfig.assetSymbol);
        }
      }
    });
    return Array.from(assetSymbols);
  }

  public getBridges(peerChainId: number, assetSymbol: string): BridgeType[] {
    const bridges: Set<BridgeType> = new Set<BridgeType>();
    this.depositContracts.forEach((depositContractConfig) => {
      if (peerChainId !== this.chainId && depositContractConfig.assetSymbol === assetSymbol) {
        const index = depositContractConfig.peerContracts.findIndex((conf) => conf.chainId === peerChainId);
        if (index >= 0) {
          bridges.add(depositContractConfig.bridgeType);
        }
      }
    });
    return Array.from(bridges);
  }

  public getDepositContract(
    peerChainId: number,
    assetSymbol: string,
    bridgeType: BridgeType,
  ): DepositContractConfig | undefined {
    const { depositContracts } = this;
    for (let i = 0; i < depositContracts.length; i += 1) {
      const depositContractConfig = depositContracts[i];
      if (
        depositContractConfig.assetSymbol === assetSymbol &&
        depositContractConfig.assetSymbol === bridgeType
      ) {
        if (peerChainId === this.chainId && bridgeType === BridgeType.LOOP) {
          return depositContractConfig;
        }
        const index = depositContractConfig.peerContracts.findIndex((conf) => conf.chainId === peerChainId);
        if (index >= 0) {
          return depositContractConfig;
        }
      }
    }
    return undefined;
  }

  public getPoolContract(assetSymbol: string, bridgeType: BridgeType): PoolContractConfig | undefined {
    return this.depositConfigsByAssetAndBridge.get(assetSymbol)?.get(bridgeType)?.poolContract;
  }

  public getDepositContractByAddress(address: string): DepositContractConfig | undefined {
    return this.depositContractConfigs.get(address);
  }

  public getPoolContractByAddress(address: string): PoolContractConfig | undefined {
    return this.poolContractConfigs.get(address);
  }

  public getEventFilterSizeByAddress(address: string): number {
    if (this.depositContractConfigs.has(address)) {
      return this.getDepositContractByAddress(address)?.eventFilterSize || this.eventFilterSize;
    }
    return this.getPoolContractByAddress(address)?.eventFilterSize || this.eventFilterSize;
  }

  private initPoolContractConfigs(
    defaultCircuitConfigs: Map<CircuitType, CircuitConfig>,
    circuitConfigsByName: Map<string, CircuitConfig>,
  ): Map<string, PoolContractConfig> {
    const poolContractConfigs = new Map<string, PoolContractConfig>();
    this.data.poolContracts.forEach((raw) => {
      check(
        !poolContractConfigs.has(raw.address),
        `duplicate pool contract=${raw.address} definition in configuration`,
      );
      poolContractConfigs.set(
        raw.address,
        new PoolContractConfig(raw, defaultCircuitConfigs, circuitConfigsByName),
      );
    });
    return poolContractConfigs;
  }

  private initDepositContractConfigs(
    poolContractConfigs: Map<string, PoolContractConfig>,
  ): Map<string, DepositContractConfig> {
    const depositContractConfigs = new Map<string, DepositContractConfig>();
    this.data.depositContracts.forEach((raw) => {
      check(
        !depositContractConfigs.has(raw.address),
        `duplicate deposit contract=${raw.address} definition in configuration`,
      );
      depositContractConfigs.set(raw.address, new DepositContractConfig(raw, poolContractConfigs));
    });
    return depositContractConfigs;
  }

  private initDepositConfigsByAssetAndBridge(): Map<string, Map<BridgeType, DepositContractConfig>> {
    const depositConfigsByAssetAndBridge = new Map<string, Map<BridgeType, DepositContractConfig>>();
    this.depositContracts.forEach((depositContractConfig) => {
      const bridges: Map<BridgeType, DepositContractConfig> =
        depositConfigsByAssetAndBridge.get(depositContractConfig.assetSymbol) ||
        new Map<BridgeType, DepositContractConfig>();
      check(
        !bridges.has(depositContractConfig.bridgeType),
        `duplicate bridge=${depositContractConfig.bridgeType} ` +
          `and asset symbol=${depositContractConfig.assetSymbol} definition ` +
          `from contract=${depositContractConfig.address}`,
      );
      depositConfigsByAssetAndBridge.set(depositContractConfig.assetSymbol, bridges);
    });
    return depositConfigsByAssetAndBridge;
  }
}
