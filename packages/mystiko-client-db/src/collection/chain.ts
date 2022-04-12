import { RxCollection } from 'rxdb';
import { ChainType } from '../schema';
import { ChainMethods } from '../document';

export type ChainCollectionMethods = {};

export type ChainCollection = RxCollection<ChainType, ChainMethods, ChainCollectionMethods>;

export const chainCollectionMethods: ChainCollectionMethods = {};
