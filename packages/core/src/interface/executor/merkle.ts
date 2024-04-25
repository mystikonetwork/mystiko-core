import { MerkleTree } from '@mystikonetwork/merkle';

export type MerkleTreeOptions = {
  chainId: number;
  contractAddress: string;
  expectedLeafIndex?: number;
  skipCache?: boolean;
  raw?: Buffer;
  providerTimeoutMs?: number;
  downloadEventListener?: (progressEvent: any) => void;
};

export interface MerkleTreeExecutor<O = MerkleTreeOptions> {
  getUrl(options: O): string;
  get(options: O): Promise<MerkleTree | undefined>;
}
