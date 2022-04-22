import BN from 'bn.js';
import { check, fromDecimals, toBN } from '@mystikonetwork/utils';
import { ContractConfig } from './base';
import { CircuitConfig } from '../circuit';
import { AssetType, BridgeType } from '../../common';
import { PoolContractConfig } from './pool';
import { RawDepositContractConfig } from '../../raw';

export class DepositContractConfig extends ContractConfig<RawDepositContractConfig> {
  private readonly poolContractGetter: (address: string) => PoolContractConfig | undefined;

  private readonly depositContractGetter: (
    chainId: number,
    address: string,
  ) => DepositContractConfig | undefined;

  constructor(
    data: RawDepositContractConfig,
    poolContractGetter: (address: string) => PoolContractConfig | undefined,
    depositContractGetter: (chainId: number, address: string) => DepositContractConfig | undefined,
  ) {
    super(data);
    this.depositContractGetter = depositContractGetter;
    this.poolContractGetter = poolContractGetter;
    this.validate();
  }

  public get bridgeType(): BridgeType {
    return this.data.bridgeType;
  }

  public get poolAddress(): string {
    return this.data.poolAddress;
  }

  public get poolContract(): PoolContractConfig {
    const poolContractConfig = this.poolContractGetter(this.poolAddress);
    if (poolContractConfig) {
      return poolContractConfig;
    }
    throw new Error(`no poolContract definition found for deposit contract=${this.address}`);
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

  public get assetType(): AssetType {
    return this.poolContract.assetType;
  }

  public get assetSymbol(): string {
    return this.poolContract.assetSymbol;
  }

  public get assetDecimals(): number {
    return this.poolContract.assetDecimals;
  }

  public get assetAddress(): string | undefined {
    return this.poolContract.assetAddress;
  }

  public get recommendedAmounts(): BN[] {
    return this.poolContract.recommendedAmounts;
  }

  public get recommendedAmountsNumber(): number[] {
    return this.poolContract.recommendedAmountsNumber;
  }

  public get minRollupFee(): BN {
    return this.poolContract.minRollupFee;
  }

  public get minRollupFeeNumber(): number {
    return this.poolContract.minRollupFeeNumber;
  }

  public get circuits(): CircuitConfig[] {
    return this.poolContract.circuits;
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
