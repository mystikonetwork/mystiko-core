import { Commitment, DatabaseQuery } from '@mystikonetwork/database';

export type CommitmentQuery = {
  chainId: number;
  contractAddress: string;
  commitmentHash: string;
};

export interface CommitmentHandler {
  upsert(commitments: Commitment[]): Promise<Commitment[]>;
  findOne(query: CommitmentQuery): Promise<Commitment | undefined>;
  find(query?: DatabaseQuery<Commitment>): Promise<Commitment[]>;
  count(query?: DatabaseQuery<Commitment>): Promise<number>;
}
