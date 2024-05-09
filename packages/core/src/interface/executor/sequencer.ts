import { Commitment } from '@mystikonetwork/database';
import BN from 'bn.js';

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

export type ImportByCommitmentHashesOptions = {
  walletPassword: string;
  chainId: number;
  contractAddress: string;
  commitmentHashes: BN[];
  timeoutMs?: number;
};

export interface SequencerExecutor<
  IO = ImportOptions,
  IR = ImportResult,
  ICO = ImportByCommitmentHashesOptions,
> {
  import(options: IO): Promise<IR>;
  importByCommitmentHashes(options: ICO): Promise<Commitment[]>;
}
