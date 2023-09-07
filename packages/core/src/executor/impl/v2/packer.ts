import { ChainConfig } from '@mystikonetwork/config';
import { Chain, ContractType } from '@mystikonetwork/database';
import { v1 as Packer } from '@mystikonetwork/datapacker-client';
import { FetchOptions } from '@mystikonetwork/datapacker-client/build/cjs/v1/client';
import { data } from '@mystikonetwork/protos';
import { promiseWithTimeout, toBN, toHex } from '@mystikonetwork/utils';
import { BigNumber, ethers } from 'ethers';
import { MystikoHandler } from '../../../handler';
import {
  CommitmentIncludedEvent,
  CommitmentQueuedEvent,
  CommitmentSpentEvent,
  ContractEvent,
  EventType,
  MystikoContextInterface,
  PackerExecutor,
  PackerImportOptions,
  PackerImportResult,
} from '../../../interface';
import { MystikoExecutor } from '../../executor';

type ImportContext = {
  chainConfig: ChainConfig;
  chain: Chain;
  syncedBlock: number;
  targetBlock: number;
  options: PackerImportOptions;
};

type PackerClient = {
  savedBlock(chainId: number): Promise<number>;
  fetch(options: FetchOptions): Promise<data.v1.ChainData | undefined>;
};

export class PackerExecutorV2 extends MystikoExecutor implements PackerExecutor {
  private readonly packerClient: PackerClient;

  constructor(context: MystikoContextInterface, client?: PackerClient) {
    super(context);
    this.packerClient = client || new Packer.PackerClient(this.config);
  }

  public import(options: PackerImportOptions): Promise<PackerImportResult> {
    const startTime = Date.now();
    let promise = this.context.wallets
      .checkPassword(options.walletPassword)
      .then(() => this.buildContext(options))
      .then((context) => this.importChainData(context).then((chainData) => ({ chainData, context })));
    if (options.timeoutMs) {
      promise = promiseWithTimeout(promise, options.timeoutMs);
    }
    return promise.then(({ chainData, context }) => {
      this.logger.debug(`fetched chain data in ${Date.now() - startTime}ms`);
      if (chainData) {
        return this.saveChainData(chainData, context);
      }
      return Promise.resolve({ syncedBlock: context.syncedBlock, commitments: [] });
    });
  }

  private importChainData(context: ImportContext): Promise<data.v1.ChainData | undefined> {
    const { syncedBlock, targetBlock, options } = context;
    if (targetBlock <= syncedBlock) {
      return Promise.resolve(undefined);
    }
    return this.packerClient.fetch({
      chainId: options.chainId,
      startBlock: syncedBlock + 1,
      targetBlock,
    });
  }

  private saveChainData(chainData: data.v1.ChainData, context: ImportContext): Promise<PackerImportResult> {
    const startTime = Date.now();
    const { options, syncedBlock } = context;
    if (Number(chainData.startBlock) !== syncedBlock + 1) {
      return Promise.reject(
        new Error(`invalid startBlock expected ${syncedBlock + 1} vs actual ${chainData.startBlock}`),
      );
    }
    const queuedEvents: CommitmentQueuedEvent[] = [];
    const includedEvents: CommitmentIncludedEvent[] = [];
    const spentEvents: CommitmentSpentEvent[] = [];
    const importedContracts: string[] = [];
    for (let i = 0; i < chainData.contractData.length; i += 1) {
      const contractData = chainData.contractData[i];
      const contractAddress = ethers.utils.getAddress(toHex(contractData.contractAddress));
      importedContracts.push(contractAddress);
      for (let j = 0; j < contractData.commitments.length; j += 1) {
        const commitment = contractData.commitments[j];
        const commitmentHash = toBN(commitment.commitmentHash, 10, 'le').toString();
        const leafIndex = commitment.leafIndex !== undefined ? commitment.leafIndex.toString() : undefined;
        const encryptedNote =
          commitment.encryptedNote !== undefined ? toHex(commitment.encryptedNote) : undefined;
        const rollupFee =
          commitment.rollupFee !== undefined ? toBN(commitment.rollupFee, 10, 'le').toString() : undefined;
        const queuedTransactionHash =
          commitment.queuedTransactionHash !== undefined
            ? toHex(commitment.queuedTransactionHash)
            : undefined;
        const includedTransactionHash =
          commitment.includedTransactionHash !== undefined
            ? toHex(commitment.includedTransactionHash)
            : undefined;
        if (commitment.status === data.v1.CommitmentStatus.QUEUED) {
          if (!leafIndex || !encryptedNote || !rollupFee || !queuedTransactionHash) {
            return Promise.reject(new Error('Invalid commitment queued data'));
          }
          queuedEvents.push({
            eventType: EventType.COMMITMENT_QUEUED,
            contractAddress,
            commitmentHash,
            leafIndex,
            encryptedNote,
            rollupFee,
            transactionHash: queuedTransactionHash,
          });
        } else if (commitment.status === data.v1.CommitmentStatus.INCLUDED) {
          if (!includedTransactionHash) {
            return Promise.reject(new Error('Invalid commitment included data'));
          }
          includedEvents.push({
            eventType: EventType.COMMITMENT_INCLUDED,
            contractAddress,
            commitmentHash,
            transactionHash: includedTransactionHash,
            leafIndex,
            encryptedNote,
            rollupFee,
          });
        }
      }
      contractData.nullifiers.forEach((nullifier) => {
        spentEvents.push({
          eventType: EventType.COMMITMENT_SPENT,
          contractAddress,
          serialNumber: toBN(nullifier.nullifier, 10, 'le').toString(),
          transactionHash: toHex(nullifier.transactionHash),
        });
      });
    }
    const sortedQueuedEvents = queuedEvents.sort((a, b) => {
      if (a.contractAddress === b.contractAddress) {
        return BigNumber.from(a.leafIndex).sub(BigNumber.from(b.leafIndex)).toNumber();
      }
      // istanbul ignore next
      return a.contractAddress.localeCompare(b.contractAddress);
    });
    const events: ContractEvent[] = [...sortedQueuedEvents, ...includedEvents, ...spentEvents];
    this.logger.debug(`processed chain data in ${Date.now() - startTime}ms`);
    return this.context.executors
      .getEventExecutor()
      .import(events, {
        chainId: options.chainId,
        walletPassword: options.walletPassword,
        skipCheckPassword: true,
      })
      .then((commitments) =>
        this.saveChainSyncedBlock(chainData, importedContracts, context).then(() => ({
          commitments,
          syncedBlock: Number(chainData.endBlock),
        })),
      );
  }

  private buildContext(options: PackerImportOptions): Promise<ImportContext> {
    const chainConfig = this.config.getChainConfig(options.chainId);
    if (!chainConfig) {
      return Promise.reject(new Error(`ChainConfig not found for chainId ${options.chainId}`));
    }
    return this.context.chains
      .findOne(options.chainId)
      .then((chain) => {
        if (!chain) {
          return Promise.reject(new Error(`Chain not found for chainId ${options.chainId}`));
        }
        return Promise.resolve(chain);
      })
      .then((chain) =>
        this.context.contracts
          .find({ selector: { chainId: options.chainId } })
          .then((contracts) => ({ chain, contracts })),
      )
      .then(({ chain, contracts }) => {
        let syncedBlock = chain.syncedBlockNumber;
        contracts.forEach((contract) => {
          const contractSyncedBlock = Math.max(contract.syncedBlockNumber, contract.syncStart);
          if (syncedBlock === 0 || contractSyncedBlock < syncedBlock) {
            syncedBlock = contractSyncedBlock;
          }
        });
        syncedBlock = Math.max(syncedBlock, chainConfig.startBlock);
        return Promise.resolve({ chain, syncedBlock });
      })
      .then(({ chain, syncedBlock }) =>
        this.packerClient
          .savedBlock(chain.chainId)
          .then((targetBlock) => ({ chainConfig, chain, syncedBlock, targetBlock, options })),
      );
  }

  private saveChainSyncedBlock(
    chainData: data.v1.ChainData,
    importedContracts: string[],
    context: ImportContext,
  ): Promise<void> {
    const { options, chain } = context;
    return this.saveContractSyncedBlock(chainData, importedContracts, context)
      .then(() => this.context.contracts.find({ selector: { chainId: options.chainId } }))
      .then((contracts) => {
        const syncedBlock = Math.min(...contracts.map((contract) => contract.syncedBlockNumber));
        if (chain.syncedBlockNumber < syncedBlock) {
          this.logger.info(`updating syncedBlockNumber to ${syncedBlock} for chain ${options.chainId}`);
          return chain
            .atomicUpdate((newChain) => {
              newChain.syncedBlockNumber = syncedBlock;
              newChain.updatedAt = MystikoHandler.now();
              return newChain;
            })
            .then(() => {});
        }
        return Promise.resolve();
      });
  }

  private saveContractSyncedBlock(
    chainData: data.v1.ChainData,
    importedContracts: string[],
    context: ImportContext,
  ): Promise<void> {
    const { options } = context;
    const endBlock = Number(chainData.endBlock);
    return this.context.contracts
      .find({
        selector: {
          chainId: options.chainId,
          contractAddress: { $in: importedContracts },
        },
      })
      .then((contracts) => {
        const updatedContracts: ContractType[] = [];
        contracts.forEach((contract) => {
          if (contract.syncedBlockNumber < endBlock) {
            this.logger.info(
              `updating syncedBlockNumber to ${endBlock} ` +
                `for chain ${options.chainId} contract ${contract.contractAddress}`,
            );
            const updatedContract = contract.toMutableJSON();
            updatedContract.syncedBlockNumber = endBlock;
            updatedContract.updatedAt = MystikoHandler.now();
            updatedContracts.push(updatedContract);
          }
        });
        return this.context.db.contracts.bulkUpsert(updatedContracts);
      })
      .then(() => {});
  }
}
