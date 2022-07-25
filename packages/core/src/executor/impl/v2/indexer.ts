import {
  ChainConfig,
  DepositContractConfig,
  IndexerConfig,
  PoolContractConfig,
} from '@mystikonetwork/config';
import { Chain, Commitment, ContractType } from '@mystikonetwork/database';
import { DefaultMystikoIndexerFactory, MystikoIndexerClient } from '@mystikonetwork/indexer-client';
import { promiseWithTimeout } from '@mystikonetwork/utils';
import { MystikoHandler } from '../../../handler';
import {
  CommitmentIncludedEvent,
  CommitmentQueuedEvent,
  CommitmentSpentEvent,
  ContractEvent,
  EventType,
  ImportOptions,
  ImportResult,
  IndexerExecutor,
  MystikoContextInterface,
} from '../../../interface';
import { MystikoExecutor } from '../../executor';

type ImportContext = {
  chainConfig?: ChainConfig;
  chain?: Chain;
  options: ImportOptions;
};

type ImportEventsContext = {
  chainConfig: ChainConfig;
  chain: Chain;
  contractAddresses: string[];
  startBlock: number;
  endBlock: number;
  targetBlock: number;
  options: ImportOptions;
};

export class IndexerExecutorV2 extends MystikoExecutor implements IndexerExecutor {
  private static readonly indexerClientFactory = new DefaultMystikoIndexerFactory();

  private readonly indexerConfig: IndexerConfig;

  private readonly indexerClient: MystikoIndexerClient;

  constructor(context: MystikoContextInterface, indexerConfig: IndexerConfig) {
    super(context);
    this.indexerConfig = indexerConfig;
    this.indexerClient = IndexerExecutorV2.indexerClientFactory.createV1Client({
      baseUrl: indexerConfig.url,
    });
  }

  public import(options: ImportOptions): Promise<ImportResult> {
    return this.context.wallets
      .checkPassword(options.walletPassword)
      .then(() => this.buildContext(options))
      .then((context) => this.importChain(context));
  }

  private buildContext(options: ImportOptions): Promise<ImportContext> {
    const chainConfig = this.config.getChainConfig(options.chainId);
    return this.context.chains
      .findOne(options.chainId)
      .then((chain) => ({ chainConfig, chain: chain || undefined, options }));
  }

  private importChain(context: ImportContext): Promise<ImportResult> {
    const { chainConfig, chain, options } = context;
    if (!chainConfig || !chain) {
      return Promise.resolve({ commitments: [], hasUpdates: false });
    }
    return promiseWithTimeout(
      this.indexerClient.queryChainSyncRepsonseById(chainConfig.chainId),
      this.indexerConfig.timeoutMs,
    )
      .then((result) => {
        const targetBlock = result.currentSyncBlockNum;
        const hasUpdates = targetBlock > chain.syncedBlockNumber;
        const contractAddresses = result.contracts.map((c) => c.contractAddress);
        const contracts = [...chainConfig.depositContracts, ...chainConfig.poolContracts];
        const startBlocks = contracts.map((c) => c.startBlock);
        const initialBlock = Math.min(...startBlocks);
        const startBlock = chain.syncedBlockNumber === 0 ? initialBlock + 1 : chain.syncedBlockNumber + 1;
        const endBlock =
          startBlock + chainConfig.indexerFilterSize - 1 > targetBlock
            ? targetBlock
            : startBlock + chainConfig.indexerFilterSize - 1;
        if (startBlock <= targetBlock) {
          this.logger.info(
            `import(chainId=${options.chainId}) blocks(#${startBlock} -> #${targetBlock}) events from indexer`,
          );
        }
        return this.importEvents({
          chainConfig,
          chain,
          contractAddresses,
          startBlock,
          endBlock,
          targetBlock,
          options,
        }).then((commitments) => ({ commitments, hasUpdates }));
      })
      .then((result) => {
        this.logger.info(
          `import(chainId=${options.chainId}) is done, imported ${result.commitments.length} commitments`,
        );
        return result;
      });
  }

  private importEvents(context: ImportEventsContext): Promise<Commitment[]> {
    const { chainConfig, startBlock, endBlock, targetBlock, options } = context;
    if (startBlock <= endBlock) {
      this.logger.debug(
        `import(chainId=${options.chainId}) blocks(#${startBlock} -> #${endBlock}) events from indexer`,
      );
      const events: Promise<ContractEvent[]>[] = [
        this.importCommitmentQueuedEvents(context),
        this.importCommitmentIncludedEvents(context),
        this.importCommitmentSpentEvents(context),
      ];
      return Promise.all(events)
        .then((fetchedEvents) => {
          const flatEvents = fetchedEvents.flat();
          return this.context.executors.getEventExecutor().import(flatEvents, {
            chainId: chainConfig.chainId,
            walletPassword: options.walletPassword,
            skipCheckPassword: true,
          });
        })
        .then((commitments) => this.saveBlockNumber(context).then(() => commitments))
        .then((commitments) => {
          const newStartBlock = endBlock + 1;
          const newEndBlock =
            endBlock + chainConfig.indexerFilterSize > targetBlock
              ? targetBlock
              : endBlock + chainConfig.indexerFilterSize;
          return this.importEvents({ ...context, startBlock: newStartBlock, endBlock: newEndBlock }).then(
            (moreCommitments) => [...commitments, ...moreCommitments],
          );
        });
    }
    return Promise.resolve([]);
  }

  private importCommitmentQueuedEvents(context: ImportEventsContext): Promise<CommitmentQueuedEvent[]> {
    const { chainConfig, startBlock, endBlock, options } = context;
    return promiseWithTimeout(
      this.indexerClient.findCommitmentQueuedForChain(chainConfig.chainId, startBlock, endBlock),
      this.indexerConfig.timeoutMs,
    ).then((rawEvents) => {
      this.logger.debug(
        `fetched ${rawEvents.length} CommitmentQueuedEvents of chainId=${options.chainId} ` +
          `blocks(#${startBlock} -> #${endBlock}) from indexer`,
      );
      return rawEvents.map((rawEvent) => ({
        eventType: EventType.COMMITMENT_QUEUED,
        chainId: chainConfig.chainId,
        contractAddress: rawEvent.contractAddress,
        transactionHash: rawEvent.txHash,
        commitmentHash: rawEvent.commitHash,
        leafIndex: rawEvent.leafIndex,
        rollupFee: rawEvent.rollupFee,
        encryptedNote: rawEvent.encryptedNote,
      }));
    });
  }

  private importCommitmentIncludedEvents(context: ImportEventsContext): Promise<CommitmentIncludedEvent[]> {
    const { chainConfig, startBlock, endBlock, options } = context;
    return promiseWithTimeout(
      this.indexerClient.findCommitmentIncludedForChain(chainConfig.chainId, startBlock, endBlock),
      this.indexerConfig.timeoutMs,
    ).then((rawEvents) => {
      this.logger.debug(
        `fetched ${rawEvents.length} CommitmentIncludedEvents of chainId=${options.chainId} ` +
          `blocks(#${startBlock} -> #${endBlock}) from indexer`,
      );
      return rawEvents.map((rawEvent) => ({
        eventType: EventType.COMMITMENT_INCLUDED,
        chainId: chainConfig.chainId,
        contractAddress: rawEvent.contractAddress,
        transactionHash: rawEvent.txHash,
        commitmentHash: rawEvent.commitHash,
      }));
    });
  }

  private importCommitmentSpentEvents(context: ImportEventsContext): Promise<CommitmentSpentEvent[]> {
    const { chainConfig, startBlock, endBlock, options } = context;
    return promiseWithTimeout(
      this.indexerClient.findCommitmentSpentForChain(chainConfig.chainId, startBlock, endBlock),
      this.indexerConfig.timeoutMs,
    ).then((rawEvents) => {
      this.logger.debug(
        `fetched ${rawEvents.length} CommitmentSpentEvents of chainId=${options.chainId} ` +
          `blocks(#${startBlock} -> #${endBlock}) from indexer`,
      );
      return rawEvents.map((rawEvent) => ({
        eventType: EventType.COMMITMENT_SPENT,
        chainId: chainConfig.chainId,
        contractAddress: rawEvent.contractAddress,
        transactionHash: rawEvent.txHash,
        serialNumber: rawEvent.serialNum,
      }));
    });
  }

  private saveBlockNumber(context: ImportEventsContext): Promise<void> {
    const { chain, chainConfig, contractAddresses, endBlock } = context;
    const contractAddressSet = new Set<string>(contractAddresses);
    let skipSaveBlockNumber = false;
    const { poolContracts, depositContracts } = chainConfig;
    const contracts: Array<PoolContractConfig | DepositContractConfig> = [
      ...poolContracts,
      ...depositContracts,
    ];
    for (let i = 0; i < contracts.length; i += 1) {
      if (!contractAddressSet.has(contracts[i].address)) {
        skipSaveBlockNumber = true;
        break;
      }
    }
    const startMs = new Date().getTime();
    let chainPromise: Promise<void> = Promise.resolve();
    if (!skipSaveBlockNumber && chain.syncedBlockNumber < endBlock) {
      chainPromise = chain
        .atomicUpdate((data) => {
          data.syncedBlockNumber = endBlock;
          data.updatedAt = MystikoHandler.now();
          return data;
        })
        .then(() => {});
    }
    return chainPromise
      .then(() => this.saveContractBlockNumber(contractAddresses, context))
      .then(() => {
        const endMs = new Date().getTime();
        this.logger.debug(`save block number of chainId=${chain.chainId} took ${endMs - startMs} ms`);
      });
  }

  private saveContractBlockNumber(contractAddresses: string[], context: ImportEventsContext): Promise<void> {
    const { chain, endBlock } = context;
    return this.context.contracts
      .find({
        selector: {
          chainId: chain.chainId,
          contractAddress: { $in: contractAddresses },
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
