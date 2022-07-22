import { BridgeType, PoolContractConfig } from '@mystikonetwork/config';
import { Chain } from '@mystikonetwork/database';

export type AssetBalance = {
  unspentTotal: number;
  pendingTotal: number;
};

export type AssetFilter = {
  chainId?: number | number[];
  shieldedAddress?: string | string[];
  bridgeType?: BridgeType | BridgeType[];
  contractAddress?: string | string[];
};

export type AssetBalanceOptions = AssetFilter & {
  asset: string;
};

export type AssetMultipleBalanceOptions = AssetFilter & {
  assets?: string[];
};

export interface AssetHandler<B = AssetBalance, O = AssetBalanceOptions, MO = AssetMultipleBalanceOptions> {
  assets(chainId: number): Promise<string[]>;
  balance(options: O): Promise<B>;
  balances(options?: MO): Promise<Map<string, B>>;
  bridges(chainId: number, assetSymbol: string): Promise<BridgeType[]>;
  chains(): Promise<Chain[]>;
  pools(chainId: number, assetSymbol: string, bridgeType: BridgeType): Promise<PoolContractConfig[]>;
}
