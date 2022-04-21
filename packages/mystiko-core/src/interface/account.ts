import { Account, DatabaseQuery } from '@mystikonetwork/database';

export type AccountOptions = {
  name?: string;
  secretKey?: string;
};

export interface AccountHandler<A = AccountOptions> {
  count(query?: DatabaseQuery<Account>): Promise<number>;
  create(options: A, walletPassword: string): Promise<Account>;
  encrypt(oldWalletPassword: string, newWalletPassword: string): Promise<void>;
  export(identifier: string, walletPassword: string): Promise<string>;
  find(query?: DatabaseQuery<Account>): Promise<Account[]>;
  findOne(identifier: string): Promise<Account | null>;
  update(identifier: string, options: AccountOptions, walletPassword: string): Promise<Account>;
}
