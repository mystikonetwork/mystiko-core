import { Wallet } from '@mystikonetwork/database';

export type WalletOptions = {
  password: string;
  masterSeed: string;
};

export interface WalletHandler<W = WalletOptions> {
  checkCurrent(): Promise<Wallet>;
  checkPassword(password: string): Promise<Wallet>;
  create(options: W): Promise<Wallet>;
  current(): Promise<Wallet | null>;
  exportMasterSeed(password: string): Promise<string>;
  updatePassword(oldPassword: string, newPassword: string): Promise<Wallet>;
}
