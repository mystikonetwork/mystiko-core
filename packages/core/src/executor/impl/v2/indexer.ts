import { ChainConfig, IndexerConfig } from '@mystikonetwork/config';
import { Chain, Commitment, Contract } from '@mystikonetwork/database';
import { DefaultMystikoIndexerFactory, MystikoIndexerClient } from '@mystikonetwork/indexer-client';
import { promiseWithTimeout } from '@mystikonetwork/utils';
import { MystikoHandler } from '../../../handler';
import {
  CommitmentIncludedEvent,
  CommitmentQueuedEvent,
  CommitmentSpentEvent,
  EventType,
  ImportOptions,
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

  public import(options: ImportOptions): Promise<Commitment[]> {
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

  private importChain(context: ImportContext): Promise<Commitment[]> {
    const { chainConfig, chain, options } = context;
    if (!chainConfig || !chain) {
      return Promise.resolve([]);
    }
    return promiseWithTimeout(
      this.indexerClient.queryChainSyncRepsonseById(chainConfig.chainId),
      this.indexerConfig.timeoutMs,
    )
      .then((result) => {
        const targetBlock = result.currentSyncBlockNum;
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
        return this.importEvents({ chainConfig, chain, startBlock, endBlock, targetBlock, options });
      })
      .then((commitments) => {
        this.logger.info(
          `import(chainId=${options.chainId}) is done, imported ${commitments.length} commitments`,
        );
        return commitments;
      });
  }

  private importEvents(context: ImportEventsContext): Promise<Commitment[]> {
    const { chainConfig, startBlock, endBlock, targetBlock, options } = context;
    if (startBlock <= endBlock) {
      this.logger.debug(
        `import(chainId=${options.chainId}) blocks(#${startBlock} -> #${endBlock}) events from indexer`,
      );
      const allCommitments: Map<string, Commitment> = new Map<string, Commitment>();
      return this.importCommitmentQueuedEvents(context)
        .then((queuedCommitments) =>
          this.importCommitmentIncludedEvents(context).then((includedCommitments) =>
            this.importCommitmentSpentEvents(context).then((spentCommitments) => {
              queuedCommitments.forEach((commitment) =>
                allCommitments.set(commitment.commitmentHash, commitment),
              );
              includedCommitments.forEach((commitment) =>
                allCommitments.set(commitment.commitmentHash, commitment),
              );
              spentCommitments.forEach((commitment) =>
                allCommitments.set(commitment.commitmentHash, commitment),
              );
              return Array.from(allCommitments.values());
            }),
          ),
        )
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

  private importCommitmentQueuedEvents(context: ImportEventsContext): Promise<Commitment[]> {
    const { chainConfig, startBlock, endBlock, options } = context;
    return promiseWithTimeout(
      this.indexerClient.findCommitmentQueuedForChain(chainConfig.chainId, startBlock, endBlock),
      this.indexerConfig.timeoutMs,
    ).then((rawEvents) => {
      this.logger.debug(
        `fetched ${rawEvents.length} CommitmentQueuedEvents of chainId=${options.chainId} ` +
          `blocks(#${startBlock} -> #${endBlock}) from indexer`,
      );
      const events: CommitmentQueuedEvent[] = rawEvents.map((rawEvent) => ({
        eventType: EventType.COMMITMENT_QUEUED,
        chainId: chainConfig.chainId,
        contractAddress: rawEvent.contractAddress,
        transactionHash: rawEvent.txHash,
        commitmentHash: rawEvent.commitHash,
        leafIndex: rawEvent.leafIndex,
        rollupFee: rawEvent.rollupFee,
        encryptedNote: rawEvent.encryptedNote,
      }));
      return this.context.executors
        .getEventExecutor()
        .importBatch(events, { walletPassword: options.walletPassword, skipCheckPassword: true });
    });
  }

  private importCommitmentIncludedEvents(context: ImportEventsContext): Promise<Commitment[]> {
    const { chainConfig, startBlock, endBlock, options } = context;
    return promiseWithTimeout(
      this.indexerClient.findCommitmentIncludedForChain(chainConfig.chainId, startBlock, endBlock),
      this.indexerConfig.timeoutMs,
    ).then((rawEvents) => {
      this.logger.debug(
        `fetched ${rawEvents.length} CommitmentIncludedEvents of chainId=${options.chainId} ` +
          `blocks(#${startBlock} -> #${endBlock}) from indexer`,
      );
      const events: CommitmentIncludedEvent[] = rawEvents.map((rawEvent) => ({
        eventType: EventType.COMMITMENT_INCLUDED,
        chainId: chainConfig.chainId,
        contractAddress: rawEvent.contractAddress,
        transactionHash: rawEvent.txHash,
        commitmentHash: rawEvent.commitHash,
      }));
      return this.context.executors
        .getEventExecutor()
        .importBatch(events, { walletPassword: options.walletPassword, skipCheckPassword: true });
    });
  }

  private importCommitmentSpentEvents(context: ImportEventsContext): Promise<Commitment[]> {
    const { chainConfig, startBlock, endBlock, options } = context;
    return promiseWithTimeout(
      this.indexerClient.findCommitmentSpentForChain(chainConfig.chainId, startBlock, endBlock),
      this.indexerConfig.timeoutMs,
    ).then((rawEvents) => {
      this.logger.debug(
        `fetched ${rawEvents.length} CommitmentSpentEvents of chainId=${options.chainId} ` +
          `blocks(#${startBlock} -> #${endBlock}) from indexer`,
      );
      const events: CommitmentSpentEvent[] = rawEvents.map((rawEvent) => ({
        eventType: EventType.COMMITMENT_SPENT,
        chainId: chainConfig.chainId,
        contractAddress: rawEvent.contractAddress,
        transactionHash: rawEvent.txHash,
        serialNumber: rawEvent.serialNum,
      }));
      return this.context.executors
        .getEventExecutor()
        .importBatch(events, { walletPassword: options.walletPassword, skipCheckPassword: true });
    });
  }

  private saveBlockNumber(context: ImportEventsContext): Promise<void> {
    const { chain, endBlock } = context;
    return chain
      .atomicUpdate((data) => {
        data.syncedBlockNumber = endBlock;
        data.updatedAt = MystikoHandler.now();
        return data;
      })
      .then(() => this.context.contracts.find({ selector: { chainId: chain.chainId } }))
      .then((contracts) => {
        const promises: Promise<Contract>[] = contracts.map((contract) =>
          contract.atomicUpdate((data) => {
            data.syncedBlockNumber = endBlock;
            data.updatedAt = MystikoHandler.now();
            return data;
          }),
        );
        return Promise.all(promises);
      })
      .then(() => {});
  }
}
