import { BridgeConfigType } from '@mystikonetwork/config';
import { Chain } from '@mystikonetwork/database';
import { MystikoContext } from '../../context';
import { MystikoHandler } from '../../handler';
import {
  AssetBalance,
  AssetBalanceOptions,
  AssetHandler,
  AssetMultipleBalanceOptions,
} from '../../interface';

export class AssetHandlerV2 extends MystikoHandler implements AssetHandler {
  constructor(context: MystikoContext) {
    super(context);
    this.context.assets = this;
  }

  public assets(chainId: number): Promise<string[]> {
    return Promise.resolve([]);
  }

  public balance(options: AssetBalanceOptions): Promise<AssetBalance> {
    return Promise.reject(new Error('not implemented'));
  }

  public balances(options?: AssetMultipleBalanceOptions): Promise<Map<string, AssetBalance>> {
    return Promise.reject(new Error('not implemented'));
  }

  public bridges(chainId: number, assetSymbol: string): Promise<BridgeConfigType[]> {
    return Promise.reject(new Error('not implemented'));
  }

  public chains(): Promise<Chain[]> {
    return Promise.reject(new Error('not implemented'));
  }
}
