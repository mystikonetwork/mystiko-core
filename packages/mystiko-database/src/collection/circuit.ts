import { RxCollection } from 'rxdb';
import { CircuitType } from '../schema';
import { CircuitMethods } from '../document';

export type CircuitCollectionMethods = {};

export type CircuitCollection = RxCollection<CircuitType, CircuitMethods, CircuitCollectionMethods>;

export const circuitCollectionMethods: CircuitCollectionMethods = {};
