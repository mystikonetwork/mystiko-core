import { RxCollection } from 'rxdb';
import { AccountType } from '../schema';
import { AccountMethods } from '../document';

export type AccountCollectionMethods = {};

export type AccountCollection = RxCollection<AccountType, AccountMethods, AccountCollectionMethods>;

export const accountCollectionMethods: AccountCollectionMethods = {};
