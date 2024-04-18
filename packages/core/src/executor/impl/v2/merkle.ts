import { CommitmentPool } from '@mystikonetwork/contracts-abi';
import { MerkleTree } from '@mystikonetwork/merkle';
import { data } from '@mystikonetwork/protos';
import { v1 as Packer } from '@mystikonetwork/datapacker-client';
import { promiseWithTimeout, toBN } from '@mystikonetwork/utils';
import * as fzstd from 'fzstd';
import BN from 'bn.js';
import { MerkleTreeExecutor, MerkleTreeOptions, MystikoContextInterface } from '../../../interface';
import { MystikoExecutor } from '../../executor';

type PackerClient = {
  merkleTree(chainId: number, contractAddress: string): Promise<data.v1.MerkleTree | undefined>;
};

type MerkleTreeWrapper = {
  chainId: number;
  contractAddress: string;
  merkleTree: MerkleTree;
  loadedBlockNumber: number;
  lastLeafIndex: number;
};

const DEFAULT_PROVIDER_QUERY_TIMEOUT_MS = 30000;

export class MerkleTreeExecutorV2 extends MystikoExecutor implements MerkleTreeExecutor {
  private readonly packerClient: PackerClient;

  private readonly merkleTrees: Map<number, Map<string, MerkleTreeWrapper>>;

  constructor(context: MystikoContextInterface, packerClient?: PackerClient) {
    super(context);
    this.packerClient = packerClient || new Packer.PackerClient(this.config);
    this.merkleTrees = new Map();
  }

  public async get(options: MerkleTreeOptions): Promise<MerkleTree | undefined> {
    const provider = await this.context.providers.getProvider(options.chainId);
    if (provider) {
      const currentBlockNumber = await promiseWithTimeout(
        provider.getBlockNumber(),
        options.providerTimeoutMs || DEFAULT_PROVIDER_QUERY_TIMEOUT_MS,
      );
      const contract = this.context.contractConnector.connect<CommitmentPool>(
        'CommitmentPool',
        options.contractAddress,
        provider,
      );
      const merkleTree = await this.getMerkleTree(options, contract, currentBlockNumber);
      if (merkleTree) {
        const isKnownRoot = await promiseWithTimeout(
          contract.isKnownRoot(merkleTree.root().toString()),
          options.providerTimeoutMs || DEFAULT_PROVIDER_QUERY_TIMEOUT_MS,
        );
        if (isKnownRoot) {
          return merkleTree;
        }
        const chainMerkleTrees = this.merkleTrees.get(options.chainId);
        if (chainMerkleTrees) {
          chainMerkleTrees.delete(options.contractAddress);
        }
        return Promise.reject(
          new Error(
            `chainId=${options.chainId} and contractAddress=${options.contractAddress}` +
              ` merkle root ${merkleTree.root().toString()} is not known`,
          ),
        );
      }
    }
    return undefined;
  }

  private async getMerkleTree(
    options: MerkleTreeOptions,
    contract: CommitmentPool,
    currentBlockNumber: number,
  ): Promise<MerkleTree | undefined> {
    let merkleTree: MerkleTreeWrapper | undefined;
    if (options.raw) {
      const rawMerkleTree = data.v1.MerkleTree.fromBinary(fzstd.decompress(options.raw));
      if (rawMerkleTree.commitmentHashes.length > 0) {
        merkleTree = {
          chainId: options.chainId,
          contractAddress: options.contractAddress,
          merkleTree: new MerkleTree(
            rawMerkleTree.commitmentHashes.map((commitmentHash) => toBN(commitmentHash, 10, 'le')),
          ),
          loadedBlockNumber: Number(rawMerkleTree.loadedBlockNumber),
          lastLeafIndex: rawMerkleTree.commitmentHashes.length - 1,
        };
        const chainMerkleTrees = this.merkleTrees.get(options.chainId) || new Map();
        chainMerkleTrees.set(options.contractAddress, merkleTree);
      }
    } else {
      merkleTree = this.merkleTrees.get(options.chainId)?.get(options.contractAddress);
      let fetchedFromPacker = false;
      if (!merkleTree || options.skipCache) {
        merkleTree = await this.fetchFromPacker(options.chainId, options.contractAddress);
        fetchedFromPacker = true;
      }
      if (merkleTree && options.expectedLeafIndex && options.expectedLeafIndex > merkleTree.lastLeafIndex) {
        if (!fetchedFromPacker) {
          merkleTree = (await this.fetchFromPacker(options.chainId, options.contractAddress)) || merkleTree;
        }
        if (options.expectedLeafIndex > merkleTree.lastLeafIndex) {
          const newLeaves = await this.fetchFromProvider(
            options,
            contract,
            merkleTree.loadedBlockNumber + 1,
            currentBlockNumber,
          );
          if (newLeaves.length > 0) {
            merkleTree.merkleTree.bulkInsert(newLeaves);
            merkleTree.loadedBlockNumber = currentBlockNumber;
            merkleTree.lastLeafIndex += newLeaves.length;
          }
        }
      }
    }
    return Promise.resolve(merkleTree?.merkleTree);
  }

  private async fetchFromPacker(
    chainId: number,
    contractAddress: string,
  ): Promise<MerkleTreeWrapper | undefined> {
    this.logger.info(
      `fetching merkle tree from packer for chainId=${chainId} contractAddress=${contractAddress}`,
    );
    const newMerkle = await this.packerClient.merkleTree(chainId, contractAddress);
    if (newMerkle && newMerkle.commitmentHashes.length > 0) {
      const leaves = newMerkle.commitmentHashes.map((commitmentHash) => toBN(commitmentHash, 10, 'le'));
      const merkleTree = new MerkleTree(leaves);
      const wrapper: MerkleTreeWrapper = {
        chainId,
        contractAddress,
        merkleTree,
        loadedBlockNumber: Number(newMerkle.loadedBlockNumber),
        lastLeafIndex: newMerkle.commitmentHashes.length - 1,
      };
      const chainMerkleTrees = this.merkleTrees.get(chainId) || new Map();
      chainMerkleTrees.set(contractAddress, wrapper);
      this.merkleTrees.set(chainId, chainMerkleTrees);
      this.logger.info(
        `fetched merkle tree(numLeaves=${newMerkle.commitmentHashes.length}) from packer` +
          ` for chainId=${chainId} contractAddress=${contractAddress}`,
      );
      return wrapper;
    }
    this.logger.warn(
      `no merkle tree found in packer for chainId=${chainId} contractAddress=${contractAddress}`,
    );
    return undefined;
  }

  private async fetchFromProvider(
    options: MerkleTreeOptions,
    contract: CommitmentPool,
    startBlockNumber: number,
    targetBlockNumber: number,
  ): Promise<BN[]> {
    this.logger.info(
      'fetching included commitments from provider ' +
        `for chainId=${options.chainId}, ` +
        `contractAddress=${options.contractAddress}, ` +
        `startBlockNumber=${startBlockNumber}, ` +
        `targetBlockNumber=${targetBlockNumber}`,
    );
    const rawEvents = await promiseWithTimeout(
      contract.queryFilter(contract.filters.CommitmentIncluded(), startBlockNumber, targetBlockNumber),
      options.providerTimeoutMs || DEFAULT_PROVIDER_QUERY_TIMEOUT_MS,
    );
    rawEvents.sort((a, b) => {
      if (a.blockNumber === b.blockNumber) {
        return a.logIndex - b.logIndex;
      }
      return a.blockNumber - b.blockNumber;
    });
    const commitments = rawEvents.map((event) => toBN(event.args.commitment.toString()));
    this.logger.info(
      `fetched ${commitments.length} included commitments from provider ` +
        `for chainId=${options.chainId}, ` +
        `contractAddress=${options.contractAddress}, ` +
        `startBlockNumber=${startBlockNumber}, ` +
        `targetBlockNumber=${targetBlockNumber}`,
    );
    return commitments;
  }
}
