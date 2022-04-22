import BN from 'bn.js';
import { check, fromDecimals, toBN } from '@mystikonetwork/utils';
import { ContractConfig } from './base';
import { RawPoolContractConfig } from '../../raw';
import { CircuitConfig } from '../circuit';
import { AssetType, CircuitType } from '../../common';

export class PoolContractConfig extends ContractConfig<RawPoolContractConfig> {
  private readonly circuitConfigs: Map<CircuitType, CircuitConfig> = new Map<CircuitType, CircuitConfig>();

  constructor(
    data: RawPoolContractConfig,
    defaultCircuitConfigs: Map<CircuitType, CircuitConfig>,
    circuitConfigsByName: Map<string, CircuitConfig>,
  ) {
    super(data);
    this.circuitConfigs = this.initCircuitsConfigs(defaultCircuitConfigs, circuitConfigsByName);
    this.validate();
  }

  public get assetType(): AssetType {
    return this.data.assetType;
  }

  public get assetSymbol(): string {
    return this.data.assetSymbol;
  }

  public get assetDecimals(): number {
    return this.data.assetDecimals;
  }

  public get assetAddress(): string | undefined {
    return this.data.assetAddress;
  }

  public get recommendedAmounts(): BN[] {
    return this.data.recommendedAmounts.map((amount) => toBN(amount));
  }

  public get recommendedAmountsNumber(): number[] {
    return this.data.recommendedAmounts.map((amount) => fromDecimals(amount, this.assetDecimals));
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
