import { DatabaseQuery, Nullifier, NullifierType } from '@mystikonetwork/database';

export type NullifierQuery = {
  chainId: number;
  contractAddress: string;
  serialNumber: string;
};

export interface NullifierHandler<Q = NullifierQuery> {
  find(query?: DatabaseQuery<Nullifier>): Promise<Nullifier[]>;
  findOne(query: Q | string): Promise<Nullifier | null>;
  upsert(data: NullifierType): Promise<Nullifier>;
}
