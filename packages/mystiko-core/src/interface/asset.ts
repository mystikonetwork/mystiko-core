import { BridgeConfigType, BridgeType } from '@mystikonetwork/config';
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
  balance(options: O): Promise<B>;
  balances(options?: MO): Promise<Map<string, B>>;
  chains(): Promise<Chain[]>;
  assets(chainId: number): Promise<string[]>;
  bridges(chainId: number, assetSymbol: string): Promise<BridgeConfigType[]>;
}
