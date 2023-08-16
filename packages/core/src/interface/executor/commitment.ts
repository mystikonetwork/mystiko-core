import { Account, Commitment } from '@mystikonetwork/database';
import { CommitmentImport, CommitmentScan } from '../handler';

export type CommitmentDecrypt = {
  walletPassword: string;
  commitments: Commitment[];
  accounts?: Account[];
};

export type CommitmentCheck = {
  chainId?: number;
  contractAddress?: string;
};

export interface CommitmentExecutor<
  CI = CommitmentImport,
  CS = CommitmentScan,
  CD = CommitmentDecrypt,
  CC = CommitmentCheck,
> {
  check(options: CC): Promise<void>;
  decrypt(options: CD): Promise<Commitment[]>;
  import(options: CI): Promise<Commitment[]>;
  scan(options: CS): Promise<Commitment[]>;
}
