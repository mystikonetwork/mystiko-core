import BN from 'bn.js';
import { check, fromDecimals, toBN } from '@mystikonetwork/utils';
import { ContractConfig } from './base';
import { CircuitConfig } from '../circuit';
import { BridgeType } from '../../common';
import { PoolContractConfig } from './pool';
import { RawDepositContractConfig } from '../../raw';

export class DepositContractConfig extends ContractConfig<RawDepositContractConfig> {
  private readonly poolContractConfig: PoolContractConfig;

  private readonly depositContractGetter: (
    chainId: number,
    address: string,
  ) => DepositContractConfig | undefined;

  constructor(
    data: RawDepositContractConfig,
    poolContractConfigs: Map<string, PoolContractConfig>,
    depositContractGetter: (chainId: number, address: string) => DepositContractConfig | undefined,
  ) {
    super(data);
    this.depositContractGetter = depositContractGetter;
    this.poolContractConfig = this.initPoolContractConfig(poolContractConfigs);
    this.validate();
  }

  public get bridgeType(): BridgeType {
    return this.data.bridgeType;
  }

  public get poolContract(): PoolContractConfig {
    return this.poolContractConfig;
  }

  public get disabled(): boolean {
    return this.data.disabled;
  }

  public get minAmount(): BN {
    return toBN(this.data.minAmount);
  }

  public get minAmountNumber(): number {
    return fromDecimals(this.data.minAmount, this.assetDecimals);
  }

  public get minBridgeFee(): BN {
    return toBN(this.data.minBridgeFee);
  }

  public get minBridgeFeeNumber(): number {
    return fromDecimals(this.minBridgeFee, this.assetDecimals);
  }

  public get minExecutorFee(): BN {
    return toBN(this.data.minExecutorFee);
  }

  public get minExecutorFeeNumber(): number {
    return fromDecimals(this.minExecutorFee, this.assetDecimals);
  }

  public get assetSymbol(): string {
    return this.poolContractConfig.assetSymbol;
  }

  public get assetDecimals(): number {
    return this.poolContractConfig.assetDecimals;
  }

  public get assetAddress(): string | undefined {
    return this.poolContractConfig.assetAddress;
  }

  public get minRollupFee(): BN {
    return this.poolContractConfig.minRollupFee;
  }

  public get minRollupFeeNumber(): number {
    return this.poolContractConfig.minRollupFeeNumber;
  }

  public get circuits(): CircuitConfig[] {
    return this.poolContractConfig.circuits;
  }

  public get peerChainId(): number | undefined {
    return this.data.peerChainId;
  }

  public get peerContractAddress(): string | undefined {
    return this.data.peerContractAddress;
  }

  public get peerContract(): DepositContractConfig | undefined {
    if (this.peerChainId && this.peerContractAddress) {
      return this.depositContractGetter(this.peerChainId, this.peerContractAddress);
    }
    return undefined;
  }

  private initPoolContractConfig(poolContractConfigs: Map<string, PoolContractConfig>): PoolContractConfig {
    const poolContractConfig = poolContractConfigs.get(this.data.poolAddress);
    if (poolContractConfig) {
      return poolContractConfig;
    }
    throw new Error(`cannot find pool contract=${this.data.poolAddress} in the configuration`);
  }

  private validate() {
    if (this.bridgeType === BridgeType.LOOP) {
      check(
        !this.peerChainId,
        `deposit contract=${this.address} peerChainId should be undefined ` +
          `when bridge type=${this.bridgeType}`,
      );
      check(
        !this.peerContractAddress,
        `deposit contract=${this.address} peerContractAddress should be undefined ` +
          `when bridge type=${this.bridgeType}`,
      );
    } else {
      check(
        !!this.peerChainId,
        `deposit contract=${this.address} peerChainId should not be undefined ` +
          `when bridge type=${this.bridgeType}`,
      );
      check(
        !!this.peerContractAddress,
        `deposit contract=${this.address} peerContractAddress should not be undefined ` +
          `when bridge type=${this.bridgeType}`,
      );
    }
  }
}
