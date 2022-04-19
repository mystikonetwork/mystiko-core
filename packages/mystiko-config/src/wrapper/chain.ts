import { check } from '@mystikonetwork/utils';
import { BaseConfig } from './base';
import { RawChainConfig } from '../raw';
import { DepositContractConfig, PoolContractConfig } from './contract';
import { CircuitConfig } from './circuit';
import { BridgeType, CircuitType } from '../common';
import { ProviderConfig } from './provider';

export class ChainConfig extends BaseConfig<RawChainConfig> {
  private readonly poolContractConfigs: Map<string, PoolContractConfig>;

  private readonly poolConfigsByAssetAndBridge: Map<string, Map<BridgeType, PoolContractConfig>>;

  private readonly depositContractConfigs: Map<string, DepositContractConfig>;

  private readonly providerConfigs: ProviderConfig[];

  constructor(
    data: RawChainConfig,
    defaultCircuitConfigs: Map<CircuitType, CircuitConfig>,
    circuitConfigsByName: Map<string, CircuitConfig>,
    depositContractGetter: (chainId: number, address: string) => DepositContractConfig | undefined,
  ) {
    super(data);
    this.poolContractConfigs = this.initPoolContractConfigs(defaultCircuitConfigs, circuitConfigsByName);
    this.depositContractConfigs = this.initDepositContractConfigs(
      this.poolContractConfigs,
      depositContractGetter,
    );
    this.poolConfigsByAssetAndBridge = this.initPoolConfigsByAssetAndBridge();
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
      } else if (depositContractConfig.peerChainId) {
        chainIds.add(depositContractConfig.peerChainId);
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
        if (peerChainId === depositContractConfig.peerChainId) {
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
        if (peerChainId === depositContractConfig.peerChainId) {
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
        depositContractConfig.bridgeType === bridgeType
      ) {
        if (peerChainId === this.chainId && bridgeType === BridgeType.LOOP) {
          return depositContractConfig;
        }
        if (peerChainId === depositContractConfig.peerChainId && bridgeType !== BridgeType.LOOP) {
          return depositContractConfig;
        }
      }
    }
    return undefined;
  }

  public getPoolContract(assetSymbol: string, bridgeType: BridgeType): PoolContractConfig | undefined {
    return this.poolConfigsByAssetAndBridge.get(assetSymbol)?.get(bridgeType);
  }

  public getDepositContractByAddress(address: string): DepositContractConfig | undefined {
    return this.depositContractConfigs.get(address);
  }

  public getPoolContractByAddress(address: string): PoolContractConfig | undefined {
    return this.poolContractConfigs.get(address);
  }

  public getEventFilterSizeByAddress(address: string): number {
    const depositContractConfig = this.depositContractConfigs.get(address);
    if (depositContractConfig) {
      return depositContractConfig.eventFilterSize || this.eventFilterSize;
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
    depositContractGetter: (chainId: number, address: string) => DepositContractConfig | undefined,
  ): Map<string, DepositContractConfig> {
    const depositContractConfigs = new Map<string, DepositContractConfig>();
    this.data.depositContracts.forEach((raw) => {
      check(
        !depositContractConfigs.has(raw.address),
        `duplicate deposit contract=${raw.address} definition in configuration`,
      );
      check(
        poolContractConfigs.has(raw.poolAddress),
        `deposit contract=${raw.address} poolAddress definition does not exist`,
      );
      if (raw.bridgeType !== BridgeType.LOOP) {
        check(
          this.chainId !== raw.peerChainId,
          `current chain id should be different with peer chain id in contract=${raw.address}`,
        );
      }
      depositContractConfigs.set(
        raw.address,
        new DepositContractConfig(
          raw,
          (address) => this.getPoolContractByAddress(address),
          depositContractGetter,
        ),
      );
    });
    return depositContractConfigs;
  }

  private initPoolConfigsByAssetAndBridge(): Map<string, Map<BridgeType, PoolContractConfig>> {
    const poolConfigsByAssetAndBridge = new Map<string, Map<BridgeType, PoolContractConfig>>();
    this.depositContracts.forEach((depositContractConfig) => {
      const bridges: Map<BridgeType, PoolContractConfig> =
        poolConfigsByAssetAndBridge.get(depositContractConfig.assetSymbol) ||
        new Map<BridgeType, PoolContractConfig>();
      const previousDepositContractConfig = bridges.get(depositContractConfig.bridgeType);
      if (previousDepositContractConfig) {
        check(
          previousDepositContractConfig.address === depositContractConfig.poolAddress,
          `only one pool address allowed for asset ${depositContractConfig.assetSymbol} ` +
            `and bridge type ${depositContractConfig.bridgeType}`,
        );
      } else {
        bridges.set(depositContractConfig.bridgeType, depositContractConfig.poolContract);
      }
      poolConfigsByAssetAndBridge.set(depositContractConfig.assetSymbol, bridges);
    });
    return poolConfigsByAssetAndBridge;
  }
}
