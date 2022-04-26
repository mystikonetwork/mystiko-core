import { Account, DatabaseQuery } from '@mystikonetwork/database';

export type AccountOptions = {
  name?: string;
  secretKey?: string;
};

export interface AccountHandler<A = AccountOptions> {
  count(query?: DatabaseQuery<Account>): Promise<number>;
  create(walletPassword: string, options?: A): Promise<Account>;
  encrypt(oldWalletPassword: string, newWalletPassword: string): Promise<void>;
  export(walletPassword: string, identifier: string): Promise<string>;
  find(query?: DatabaseQuery<Account>): Promise<Account[]>;
  findOne(identifier: string): Promise<Account | null>;
  update(walletPassword: string, identifier: string, options: AccountOptions): Promise<Account>;
}
