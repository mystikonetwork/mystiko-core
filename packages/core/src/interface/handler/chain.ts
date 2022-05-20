import { Chain, DatabaseQuery, ProviderType } from '@mystikonetwork/database';

export type ChainOptions = {
  name?: string;
  providers?: ProviderType[];
};

export interface ChainHandler<C = ChainOptions> {
  find(query?: DatabaseQuery<Chain>): Promise<Chain[]>;
  findOne(chainId: number): Promise<Chain | null>;
  init(): Promise<Chain[]>;
  update(chainId: number, options: C): Promise<Chain | null>;
  reset(chainId: number): Promise<Chain | null>;
}
