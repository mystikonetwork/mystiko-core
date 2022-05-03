import { check, fromDecimals, toBN } from '@mystikonetwork/utils';
import BN from 'bn.js';
import { AssetType, CircuitType } from '../../common';
import { RawPoolContractConfig } from '../../raw';
import { AssetConfig } from '../asset';
import { CircuitConfig } from '../circuit';
import { ContractConfig } from './base';

type AuxData = {
  defaultCircuitConfigs: Map<CircuitType, CircuitConfig>;
  circuitConfigsByName: Map<string, CircuitConfig>;
  mainAssetConfig: AssetConfig;
  assetConfigs: Map<string, AssetConfig>;
};

export class PoolContractConfig extends ContractConfig<RawPoolContractConfig, AuxData> {
  private readonly circuitConfigs: Map<CircuitType, CircuitConfig> = new Map<CircuitType, CircuitConfig>();

  private readonly mainAssetConfig: AssetConfig;

  private readonly assetConfig?: AssetConfig;

  constructor(data: RawPoolContractConfig, auxData?: AuxData) {
    super(data, auxData);
    this.circuitConfigs = this.initCircuitsConfigs(
      this.auxDataNotEmpty.defaultCircuitConfigs,
      this.auxDataNotEmpty.circuitConfigsByName,
    );
    this.assetConfig = this.initAssetConfig(this.auxDataNotEmpty.assetConfigs);
    this.mainAssetConfig = this.auxDataNotEmpty.mainAssetConfig;
    this.validate();
  }

  public get asset(): AssetConfig {
    return this.assetConfig || this.mainAssetConfig;
  }

  public get assetType(): AssetType {
    return this.asset.assetType;
  }

  public get assetSymbol(): string {
    return this.asset.assetSymbol;
  }

  public get assetDecimals(): number {
    return this.asset.assetDecimals;
  }

  public get assetAddress(): string | undefined {
    return this.data.assetAddress;
  }

  public get recommendedAmounts(): BN[] {
    return this.asset.recommendedAmounts.map((amount) => toBN(amount));
  }

  public get recommendedAmountsNumber(): number[] {
    return this.asset.recommendedAmounts.map((amount) => fromDecimals(amount, this.assetDecimals));
  }

  public get minRollupFee(): BN {
    return toBN(this.data.minRollupFee);
  }

  public get minRollupFeeNumber(): number {
    return fromDecimals(this.minRollupFee, this.assetDecimals);
  }

  public get circuits(): CircuitConfig[] {
    return Array.from(this.circuitConfigs.values());
  }

  public getCircuitConfig(type: CircuitType): CircuitConfig | undefined {
    return this.circuitConfigs.get(type);
  }

  public mutate(data?: RawPoolContractConfig, auxData?: AuxData): PoolContractConfig {
    return new PoolContractConfig(data || this.data, auxData || this.auxData);
  }

  private initCircuitsConfigs(
    defaultCircuitConfigs: Map<CircuitType, CircuitConfig>,
    circuitConfigsByName: Map<string, CircuitConfig>,
  ): Map<CircuitType, CircuitConfig> {
    const circuitConfigs = new Map<CircuitType, CircuitConfig>();
    defaultCircuitConfigs.forEach((circuitConf) => {
      circuitConfigs.set(circuitConf.type, circuitConf);
    });
    this.data.circuits.forEach((circuitName) => {
      const circuitConf = circuitConfigsByName.get(circuitName);
      if (circuitConf) {
        circuitConfigs.set(circuitConf.type, circuitConf);
      }
    });
    return circuitConfigs;
  }

  private initAssetConfig(assetConfigs: Map<string, AssetConfig>): AssetConfig | undefined {
    if (this.data.assetAddress) {
      const assetConfig = assetConfigs.get(this.data.assetAddress);
      if (!assetConfig) {
        throw new Error(
          `asset address=${this.data.assetAddress} config ` +
            `has not been defined for pool contract address=${this.data.address}`,
        );
      }
      return assetConfig;
    }
    return undefined;
  }

  private validate() {
    if (this.assetType === AssetType.MAIN) {
      check(
        !this.assetAddress,
        `pool contract=${this.address} asset address should be null when asset type=${this.assetType}`,
      );
    } else {
      check(
        !!this.assetAddress,
        `pool contract=${this.address} asset address should not be null ` +
          `when asset type=${this.assetType}`,
      );
    }
  }
}
