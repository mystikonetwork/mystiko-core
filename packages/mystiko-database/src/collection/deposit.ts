import { RxCollection } from 'rxdb';
import { DepositType } from '../schema';
import { DepositMethods } from '../document';

export type DepositCollectionMethods = {};

export type DepositCollection = RxCollection<DepositType, DepositMethods, DepositCollectionMethods>;

export const depositCollectionMethods: DepositCollectionMethods = {};
