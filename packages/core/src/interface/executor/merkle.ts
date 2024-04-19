import { MerkleTree } from '@mystikonetwork/merkle';

export type MerkleTreeOptions = {
  chainId: number;
  contractAddress: string;
  expectedLeafIndex?: number;
  skipCache?: boolean;
  raw?: Buffer;
  providerTimeoutMs?: number;
};

export interface MerkleTreeExecutor<O = MerkleTreeOptions> {
  get(options: O): Promise<MerkleTree | undefined>;
}
