import { RxDocument } from 'rxdb';
import { ContractType } from '../schema';

export type ContractMethods = {};

export type Contract = RxDocument<ContractType, ContractMethods>;

export const contractMethods: ContractMethods = {};
