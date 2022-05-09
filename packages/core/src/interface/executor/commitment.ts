import { Commitment } from '@mystikonetwork/database';
import { CommitmentImport, CommitmentScan } from '../handler';

export interface CommitmentExecutor<CI = CommitmentImport, CS = CommitmentScan> {
  import(options: CI): Promise<Commitment[]>;
  scan(options: CS): Promise<Commitment[]>;
}
