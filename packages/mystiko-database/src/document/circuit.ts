import { RxDocument } from 'rxdb';
import { CircuitType } from '../schema';

export type CircuitMethods = {};

export type Circuit = RxDocument<CircuitType, CircuitMethods>;

export const circuitMethods: CircuitMethods = {};
