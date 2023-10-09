import { ChainConfig, DepositContractConfig, PoolContractConfig } from '@mystikonetwork/config';
import { Chain, Commitment, ContractType } from '@mystikonetwork/database';
import { data } from '@mystikonetwork/protos';
import * as sequencer from '@mystikonetwork/sequencer-client';
import { promiseWithTimeout, toBN, toHex } from '@mystikonetwork/utils';
import { BigNumber } from 'ethers';
import { MystikoHandler } from '../../../handler';
import {
  CommitmentIncludedEvent,
  CommitmentQueuedEvent,
  CommitmentSpentEvent,
  ContractEvent,
  EventType,
  ImportOptions,
  ImportResult,
  SequencerExecutor,
  MystikoContextInterface,
} from '../../../interface';
import { MystikoExecutor } from '../../executor';

type ImportContext = {
  chainConfig?: ChainConfig;
  chain?: Chain;
  options: ImportOptions;
  timeoutMs: number;
};

type ImportEventsContext = {
  chainConfig: ChainConfig;
  chain: Chain;
  startBlock: number;
  endBlock: number;
  targetBlock: number;
  options: ImportOptions;
  timeoutMs: number;
  fetchedContractAddresses: Set<string>;
};

const DEFAULT_FETCH_TIMEOUT_MS = 120000;

export class SequencerExecutorV2 extends MystikoExecutor implements SequencerExecutor {
  private readonly sequencerClient: sequencer.v1.SequencerClient;

  constructor(context: MystikoContextInterface, sequencerClient: sequencer.v1.SequencerClient) {
    super(context);
    this.sequencerClient = sequencerClient;
  }

  public import(options: ImportOptions): Promise<ImportResult> {
    return this.context.wallets
      .checkPassword(options.walletPassword)
      .then(() => this.buildContext(options))
      .then((context) => this.importChain(context));
  }

  private buildContext(options: ImportOptions): Promise<ImportContext> {
    const chainConfig = this.config.getChainConfig(options.chainId);
    const timeoutMs = options.timeoutMs || DEFAULT_FETCH_TIMEOUT_MS;
    return this.context.chains
      .findOne(options.chainId)
      .then((chain) => ({ chainConfig, chain: chain || undefined, options, timeoutMs }));
  }

  private importChain(context: ImportContext): Promise<ImportResult> {
    const { chainConfig, chain, options, timeoutMs } = context;
    if (!chainConfig || !chain) {
      return Promise.resolve({ commitments: [], hasUpdates: false });
    }
    return promiseWithTimeout(this.sequencerClient.chainLoadedBlock(options.chainId), timeoutMs)
      .then((targetBlock) => {
        const hasUpdates = targetBlock > chain.syncedBlockNumber;
        const contracts = [...chainConfig.depositContracts, ...chainConfig.poolContracts];
        const startBlocks = contracts.map((c) => c.startBlock);
        const initialBlock = Math.min(...startBlocks);
        const startBlock = chain.syncedBlockNumber === 0 ? initialBlock + 1 : chain.syncedBlockNumber + 1;
        const endBlock =
          startBlock + chainConfig.sequencerFetchSize - 1 > targetBlock
            ? targetBlock
            : startBlock + chainConfig.sequencerFetchSize - 1;
        if (startBlock <= targetBlock) {
          this.logger.info(
            `import(chainId=${options.chainId}) blocks(#${startBlock} -> #${targetBlock}) events from sequencer`,
          );
        }
        const eventsContext: ImportEventsContext = {
          chainConfig,
          chain,
          startBlock,
          endBlock,
          targetBlock,
          options,
          timeoutMs,
          fetchedContractAddresses: new Set(),
        };
        let promise = this.importEvents(eventsContext);
        if (options.timeoutMs) {
          promise = promiseWithTimeout(promise, options.timeoutMs);
        }
        return promise.then((fetchResult) => {
          eventsContext.endBlock = fetchResult.context.endBlock;
          return this.saveEvents(eventsContext, fetchResult.events).then((commitments) => ({
            commitments,
            hasUpdates,
          }));
        });
      })
      .then((result) => {
        this.logger.info(
          `import(chainId=${options.chainId}) is done, imported ${result.commitments.length} commitments`,
        );
        return result;
      });
  }

  private importEvents(
    context: ImportEventsContext,
  ): Promise<{ context: ImportEventsContext; events: ContractEvent[] }> {
    const { chainConfig, startBlock, endBlock, targetBlock, options, fetchedContractAddresses } = context;
    if (startBlock <= endBlock) {
      this.logger.debug(
        `import(chainId=${options.chainId}) blocks(#${startBlock} -> #${endBlock}) events from sequencer`,
      );
      return this.sequencerClient
        .fetchChain(options.chainId, {
          startBlock,
          targetBlock: endBlock,
          isFull: true,
        })
        .then((contractsData) => {
          const queuedEvents: CommitmentQueuedEvent[] = [];
          const includedEvents: CommitmentIncludedEvent[] = [];
          const spentEvents: CommitmentSpentEvent[] = [];
          for (let i = 0; i < contractsData.length; i += 1) {
            const contractData = contractsData[i];
            fetchedContractAddresses.add(contractData.contractAddress);
            for (let j = 0; j < contractData.commitments.length; j += 1) {
              const commitment = contractData.commitments[j];
              const commitmentHash = toBN(commitment.commitmentHash, 10, 'le').toString();
              const leafIndex =
                commitment.leafIndex !== undefined ? commitment.leafIndex.toString() : undefined;
              const encryptedNote =
                commitment.encryptedNote !== undefined ? toHex(commitment.encryptedNote) : undefined;
              const rollupFee =
                commitment.rollupFee !== undefined
                  ? toBN(commitment.rollupFee, 10, 'le').toString()
                  : undefined;
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
                  contractAddress: contractData.contractAddress,
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
                  contractAddress: contractData.contractAddress,
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
                contractAddress: contractData.contractAddress,
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
          return Promise.resolve([sortedQueuedEvents, includedEvents, spentEvents].flat());
        })
        .then((events) => {
          const newStartBlock = endBlock + 1;
          const newEndBlock =
            endBlock + chainConfig.sequencerFetchSize > targetBlock
              ? targetBlock
              : endBlock + chainConfig.sequencerFetchSize;
          return this.importEvents({ ...context, startBlock: newStartBlock, endBlock: newEndBlock }).then(
            (result) => ({ context: result.context, events: [...events, ...result.events] }),
          );
        });
    }
    return Promise.resolve({ context, events: [] });
  }

  private saveEvents(context: ImportEventsContext, events: ContractEvent[]): Promise<Commitment[]> {
    const { chainConfig, options } = context;
    return this.context.executors
      .getEventExecutor()
      .import(events, {
        chainId: chainConfig.chainId,
        walletPassword: options.walletPassword,
        skipCheckPassword: true,
      })
      .then((commitments) => this.saveBlockNumber(context).then(() => commitments));
  }

  private saveBlockNumber(context: ImportEventsContext): Promise<void> {
    const { chain, chainConfig, endBlock, fetchedContractAddresses } = context;
    let skipSaveBlockNumber = false;
    const { poolContracts, depositContracts } = chainConfig;
    const contracts: Array<PoolContractConfig | DepositContractConfig> = [
      ...poolContracts,
      ...depositContracts,
    ];
    for (let i = 0; i < contracts.length; i += 1) {
      if (!fetchedContractAddresses.has(contracts[i].address)) {
        skipSaveBlockNumber = true;
        break;
      }
    }
    const startMs = new Date().getTime();
    let chainPromise: Promise<void> = Promise.resolve();
    if (!skipSaveBlockNumber && chain.syncedBlockNumber < endBlock) {
      chainPromise = chain
        .atomicUpdate((chainData) => {
          chainData.syncedBlockNumber = endBlock;
          chainData.updatedAt = MystikoHandler.now();
          return chainData;
        })
        .then(() => {});
    }
    return chainPromise
      .then(() => this.saveContractBlockNumber(context))
      .then(() => {
        const endMs = new Date().getTime();
        this.logger.debug(`save block number of chainId=${chain.chainId} took ${endMs - startMs} ms`);
      });
  }

  private saveContractBlockNumber(context: ImportEventsContext): Promise<void> {
    const { chain, endBlock, fetchedContractAddresses } = context;
    return this.context.contracts
      .find({
        selector: {
          chainId: chain.chainId,
          contractAddress: { $in: [...fetchedContractAddresses] },
        },
      })
      .then((contracts) => {
        const updatedContracts: ContractType[] = [];
        contracts.forEach((contract) => {
          if (contract.syncedBlockNumber < endBlock) {
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
