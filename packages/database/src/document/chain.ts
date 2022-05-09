import { RxDocument } from 'rxdb';
import { ChainType } from '../schema';

export type ChainMethods = {};

export type Chain = RxDocument<ChainType, ChainMethods>;

export const chainMethods: ChainMethods = {};
