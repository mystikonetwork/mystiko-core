import { Chain, DatabaseQuery } from '@mystikonetwork/database';

export type ChainOptions = {
  name?: string;
  providers?: string[];
};

export interface ChainHandler<C = ChainOptions> {
  find(query?: DatabaseQuery<Chain>): Promise<Chain[]>;
  findOne(chainId: number): Promise<Chain | null>;
  init(): Promise<Chain[]>;
  update(chainId: number, options: C): Promise<Chain | null>;
}