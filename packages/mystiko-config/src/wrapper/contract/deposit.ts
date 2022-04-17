import BN from 'bn.js';
import { check, fromDecimals, toBN } from '@mystikonetwork/utils';
import { ContractConfig } from './base';
import { CircuitConfig } from '../circuit';
import { BridgeType } from '../../common';
import { PoolContractConfig } from './pool';
import { PeerContractConfig } from './peer';
import { RawDepositContractConfig } from '../../raw';

export class DepositContractConfig extends ContractConfig<RawDepositContractConfig> {
  private readonly poolContractConfig: PoolContractConfig;

  private readonly peerContractConfigs: Map<number, PeerContractConfig>;

  constructor(data: RawDepositContractConfig, poolContractConfigs: Map<string, PoolContractConfig>) {
    super(data);
    this.poolContractConfig = this.initPoolContractConfig(poolContractConfigs);
    this.peerContractConfigs = this.initPeerChainConfigs();
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

  public get peerContracts(): PeerContractConfig[] {
    return Array.from(this.peerContractConfigs.values());
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

  public getPeerContractConfig(peerChainId: number): PeerContractConfig | undefined {
    return this.peerContractConfigs.get(peerChainId);
  }

  private initPoolContractConfig(poolContractConfigs: Map<string, PoolContractConfig>): PoolContractConfig {
    const poolContractConfig = poolContractConfigs.get(this.data.poolAddress);
    if (poolContractConfig) {
      return poolContractConfig;
    }
    throw new Error(`cannot find pool contract=${this.data.poolAddress} in the configuration`);
  }

  private initPeerChainConfigs(): Map<number, PeerContractConfig> {
    const peerContractConfigs = new Map<number, PeerContractConfig>();
    this.data.peerChains.forEach((peerChainConfig) => {
      check(
        !peerContractConfigs.has(peerChainConfig.chainId),
        `duplicate peer chain id=${peerChainConfig.chainId} for deposit contract=${this.address}`,
      );
      peerContractConfigs.set(peerChainConfig.chainId, new PeerContractConfig(peerChainConfig));
    });
    if (this.bridgeType === BridgeType.LOOP) {
      check(
        peerContractConfigs.size === 0,
        `contract=${this.address} bridge type=${BridgeType.LOOP}, but it contains peer chain configurations`,
      );
    } else {
      check(
        peerContractConfigs.size > 0,
        `contract=${this.address} bridge type=${this.bridgeType}, but it does not contain peer chain configurations`,
      );
    }
    return peerContractConfigs;
  }
}
