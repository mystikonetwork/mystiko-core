import { Commitment } from '@mystikonetwork/database';

export type ImportOptions = {
  walletPassword: string;
  chainId: number;
  timeoutMs?: number;
  contractAddresses?: string[];
};

export type ImportResult = {
  commitments: Commitment[];
  hasUpdates: boolean;
};

export interface SequencerExecutor<IO = ImportOptions, IR = ImportResult> {
  import(options: IO): Promise<IR>;
}
