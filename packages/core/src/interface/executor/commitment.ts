import { Account, Commitment } from '@mystikonetwork/database';
import { CommitmentImport, CommitmentScan } from '../handler';

export type CommitmentDecrypt = {
  walletPassword: string;
  commitment: Commitment;
  accounts?: Account[];
};

export interface CommitmentExecutor<CI = CommitmentImport, CS = CommitmentScan, CD = CommitmentDecrypt> {
  import(options: CI): Promise<Commitment[]>;
  scan(options: CS): Promise<Commitment[]>;
  decrypt(options: CD): Promise<Commitment>;
}
