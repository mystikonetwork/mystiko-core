import { Commitment } from '@mystikonetwork/database';

export type ImportOptions = {
  walletPassword: string;
  chainId: number;
};

export interface IndexerExecutor<IO = ImportOptions> {
  import(options: IO): Promise<Commitment[]>;
}
