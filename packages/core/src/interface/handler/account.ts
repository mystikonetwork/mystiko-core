import { Account, AccountStatus, DatabaseQuery } from '@mystikonetwork/database';

export type AccountOptions = {
  name?: string;
  secretKey?: string;
  scanSize?: number;
};

export type AccountUpdate = {
  name?: string;
  scanSize?: number;
  status?: AccountStatus;
};

export interface AccountHandler<A = AccountOptions, U = AccountUpdate> {
  init(): Promise<void>;
  count(query?: DatabaseQuery<Account>): Promise<number>;
  create(walletPassword: string, options?: A): Promise<Account>;
  encrypt(oldWalletPassword: string, newWalletPassword: string): Promise<void>;
  export(walletPassword: string, identifier: string): Promise<string>;
  find(query?: DatabaseQuery<Account>): Promise<Account[]>;
  findOne(identifier: string): Promise<Account | null>;
  update(walletPassword: string, identifier: string, options: U): Promise<Account>;
  scan(walletPassword: string, identifier?: string | DatabaseQuery<Account>): Promise<Account[]>;
  resetScan(walletPassword: string, identifier?: string | DatabaseQuery<Account>): Promise<Account[]>;
}
