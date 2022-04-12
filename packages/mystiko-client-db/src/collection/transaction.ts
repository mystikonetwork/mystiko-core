import { RxCollection } from 'rxdb';
import { TransactionType } from '../schema';
import { TransactionMethods } from '../document';

export type TransactionCollectionMethods = {};

export type TransactionCollection = RxCollection<
  TransactionType,
  TransactionMethods,
  TransactionCollectionMethods
>;

export const transactionCollectionMethods: TransactionCollectionMethods = {};
