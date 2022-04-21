import { Commitment, CommitmentStatus, DatabaseQuery } from '@mystikonetwork/database';
import { BridgeType } from '@mystikonetwork/config';

export type CommitmentContractQuery = {
  chainId: number;
  contractAddress: string;
  statuses?: CommitmentStatus[];
  shieldedAddresses?: string[];
};

export type CommitmentAssetAndBridgeQuery = {
  chainId: number;
  assetSymbol: string;
  bridgeType: BridgeType;
  statuses?: CommitmentStatus[];
  shieldedAddresses?: string[];
};

export type CommitmentQuery = {
  chainId: number;
  contractAddress: string;
  commitmentHash: string;
};

export interface CommitmentHandler<
  C = CommitmentContractQuery,
  AB = CommitmentAssetAndBridgeQuery,
  Q = CommitmentQuery,
> {
  find(query?: DatabaseQuery<Commitment>): Promise<Commitment[]>;
  findByContract(query: C): Promise<Commitment[]>;
  findByAssetAndBridge(query: AB): Promise<Commitment[]>;
  findOne(query: Q): Promise<Commitment | null>;
}
