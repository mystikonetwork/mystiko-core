import { Contract, DatabaseQuery } from '@mystikonetwork/database';

export type ContractOptions = {
  chainId: number;
  address: string;
};

export interface ContractHandler<O = ContractOptions> {
  find(query?: DatabaseQuery<Contract>): Promise<Contract[]>;
  findOne(options: O): Promise<Contract | null>;
  init(): Promise<Contract[]>;
}
