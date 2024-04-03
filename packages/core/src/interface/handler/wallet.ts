import { Wallet } from '@mystikonetwork/database';

export type WalletOptions = {
  password: string;
  masterSeed: string;
  fullSynchronization?: boolean;
};

export type FullSynchronizationAssetOptions = {
  assetSymbol: string;
  enabled: boolean;
};

export type FullSynchronizationChainOptions = {
  chainId: number;
  name: string;
  assets: FullSynchronizationAssetOptions[];
  enabled: boolean;
};

export type FullSynchronizationOptions = {
  chains: FullSynchronizationChainOptions[];
};

export interface WalletHandler<W = WalletOptions> {
  checkCurrent(): Promise<Wallet>;
  checkPassword(password: string): Promise<Wallet>;
  create(options: W): Promise<Wallet>;
  current(): Promise<Wallet | null>;
  exportMasterSeed(password: string): Promise<string>;
  updatePassword(oldPassword: string, newPassword: string): Promise<Wallet>;
  autoSync(enable: boolean): Promise<Wallet>;
  autoSyncInterval(intervalSeconds: number): Promise<Wallet>;
  fullSynchronization(enable: boolean): Promise<Wallet>;
  getFullSynchronizationOptions(): Promise<FullSynchronizationOptions>;
  setFullSynchronizationOptions(options: FullSynchronizationOptions): Promise<Wallet>;
}
