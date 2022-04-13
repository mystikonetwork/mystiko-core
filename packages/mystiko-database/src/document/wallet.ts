import { RxDocument } from 'rxdb';
import { WalletType } from '../schema';

export type WalletMethods = {};

export type Wallet = RxDocument<WalletType, WalletMethods>;

export const walletMethods: WalletMethods = {};
