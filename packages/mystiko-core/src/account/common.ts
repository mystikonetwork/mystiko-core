import { Account, DatabaseQuery } from '@mystikonetwork/database';
import { BridgeType } from '@mystikonetwork/config';

export type AccountOptions = {
  name?: string;
  secretKey?: string;
};

export type AccountBalanceQuery = {
  query?: DatabaseQuery<Account>;
  chainId?: number;
  bridgeType?: BridgeType;
  assetSymbol: string;
};

export type MaxTransactionBalanceQuery = {
  chainId: number;
  bridgeType: BridgeType;
  assetSymbol: string;
};

export type AccountBalance = {
  assetSymbol: string;
  total: number;
  pendingTotal: number;
};

export interface AccountHandler<A = AccountOptions, B = AccountBalance> {
  balanceAll(query?: DatabaseQuery<Account>): Promise<B[]>;
  balanceOf(query: AccountBalanceQuery): Promise<B>;
  count(query?: DatabaseQuery<Account>): Promise<number>;
  create(options: A, walletPassword: string): Promise<Account>;
  encrypt(oldWalletPassword: string, newWalletPassword: string): Promise<void>;
  export(identifier: string, walletPassword: string): Promise<string>;
  find(query?: DatabaseQuery<Account>): Promise<Account[]>;
  findOne(identifier: string): Promise<Account | null>;
  maxTransactionBalanceOf(query: MaxTransactionBalanceQuery): Promise<number>;
  update(identifier: string, options: AccountOptions, walletPassword: string): Promise<Account>;
}
