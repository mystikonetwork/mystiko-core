import { Commitment } from '@mystikonetwork/database';
import { CommitmentImport } from '../handler';

export interface CommitmentExecutor<CI = CommitmentImport> {
  import(options: CI): Promise<Commitment[]>;
}
