import { Commitment, CommitmentStatus, DatabaseQuery } from '@mystikonetwork/database';

export type CommitmentContractQuery = {
  chainId: number;
  contractAddress: string;
  statuses?: CommitmentStatus[];
  shieldedAddresses?: string[];
};

export type CommitmentQuery = {
  chainId: number;
  contractAddress: string;
  commitmentHash: string;
};

export type CommitmentImport = {
  walletPassword: string;
  chainId?: number;
  contractAddress?: string;
};

export interface CommitmentHandler<C = CommitmentContractQuery, Q = CommitmentQuery, CI = CommitmentImport> {
  find(query?: DatabaseQuery<Commitment>): Promise<Commitment[]>;
  findByContract(query: C): Promise<Commitment[]>;
  findOne(query: Q | string): Promise<Commitment | null>;
  import(options: CI): Promise<Commitment[]>;
}
