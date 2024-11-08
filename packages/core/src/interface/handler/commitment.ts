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
  contractAddresses?: string[];
  timeoutMs?: number;
};

export type CommitmentScan = {
  walletPassword: string;
  shieldedAddress: string;
};

export type CommitmentScanAll = {
  walletPassword: string;
};

export interface CommitmentHandler<
  C = CommitmentContractQuery,
  Q = CommitmentQuery,
  CI = CommitmentImport,
  CS = CommitmentScan,
  CSA = CommitmentScanAll,
> {
  find(query?: DatabaseQuery<Commitment>): Promise<Commitment[]>;
  findByContract(query: C): Promise<Commitment[]>;
  findOne(query: Q | string): Promise<Commitment | null>;
  import(options: CI): Promise<Commitment[]>;
  scan(options: CS): Promise<Commitment[]>;
  scanAll(options: CSA): Promise<Commitment[][]>;
}
