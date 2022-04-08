import { RxCollection } from 'rxdb';
import { WalletType } from '../schema';
import { WalletMethods } from '../document';

export type WalletCollectionMethods = {};

export const walletCollectionMethods: WalletCollectionMethods = {};

export type WalletCollection = RxCollection<WalletType, WalletMethods, WalletCollectionMethods>;
