import { RxCollection } from 'rxdb';
import { ContractType } from '../schema';
import { ContractMethods } from '../document';

export type ContractCollectionMethods = {};

export type ContractCollection = RxCollection<ContractType, ContractMethods, ContractCollectionMethods>;

export const contractCollectionMethods: ContractCollectionMethods = {};
