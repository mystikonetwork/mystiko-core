import { check, fromDecimals, toBN } from '@mystikonetwork/utils';
import BN from 'bn.js';
import { AssetType } from '../common';
import { RawAssetConfig } from '../raw';
import { BaseConfig } from './base';

export const MAIN_ASSET_ADDRESS = '0x0000000000000000000000000000000000000000';

export class AssetConfig extends BaseConfig<RawAssetConfig> {
  constructor(raw: RawAssetConfig) {
    super(raw);
    this.validate();
  }

  public get assetAddress(): string {
    return this.data.assetAddress;
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

  public get recommendedAmounts(): BN[] {
    return this.data.recommendedAmounts.map((amount) => toBN(amount));
  }

  public get recommendedAmountsNumber(): number[] {
    return this.data.recommendedAmounts.map((amount) => fromDecimals(amount, this.assetDecimals));
  }

  public mutate(data?: RawAssetConfig): AssetConfig {
    return new AssetConfig(data || this.data);
  }

  private validate() {
    check(
      (this.assetType !== AssetType.MAIN && this.assetAddress !== MAIN_ASSET_ADDRESS) ||
        (this.assetType === AssetType.MAIN && this.assetAddress === MAIN_ASSET_ADDRESS),
      `wrong asset address=${this.assetAddress} and type=${this.assetType}`,
    );
  }
}
