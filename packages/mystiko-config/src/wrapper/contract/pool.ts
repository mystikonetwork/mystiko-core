import BN from 'bn.js';
import { fromDecimals, toBN } from '@mystikonetwork/utils';
import { ContractConfig } from './base';
import { RawPoolContractConfig } from '../../raw';
import { CircuitConfig } from '../circuit';
import { CircuitType } from '../../common';

export class PoolContractConfig extends ContractConfig<RawPoolContractConfig> {
  private readonly circuitConfigs: Map<CircuitType, CircuitConfig> = new Map<CircuitType, CircuitConfig>();

  constructor(
    data: RawPoolContractConfig,
    defaultCircuitConfigs: Map<CircuitType, CircuitConfig>,
    circuitConfigsByName: Map<string, CircuitConfig>,
  ) {
    super(data);
    this.circuitConfigs = this.initCircuitsConfigs(defaultCircuitConfigs, circuitConfigsByName);
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
}
