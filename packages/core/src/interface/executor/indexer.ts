import { Commitment } from '@mystikonetwork/database';

export type ImportOptions = {
  walletPassword: string;
  chainId: number;
};

export type ImportResult = {
  commitments: Commitment[];
  hasUpdates: boolean;
};

export interface IndexerExecutor<IO = ImportOptions, IR = ImportResult> {
  import(options: IO): Promise<IR>;
}
