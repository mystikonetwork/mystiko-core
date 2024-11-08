import { BridgeType, PoolContractConfig } from '@mystikonetwork/config';
import { CommitmentPool } from '@mystikonetwork/contracts-abi';
import { Chain, Commitment, CommitmentStatus, TransactionStatus } from '@mystikonetwork/database';
import { fromDecimals, promiseWithTimeout, toBN } from '@mystikonetwork/utils';
import { ethers } from 'ethers';
import {
  AssetBalance,
  AssetBalanceOptions,
  AssetChainImportOptions,
  AssetHandler,
  AssetImportOptions,
  AssetMultipleBalanceOptions,
  AssetSyncOptions,
  CommitmentIncludedEvent,
  CommitmentQueuedEvent,
  EventType,
  ImportByCommitmentHashesOptions,
  MystikoContextInterface,
} from '../../../interface';
import { MystikoHandler } from '../../handler';

export const DEFAULT_PROVIDER_QUERY_TIMEOUT_MS = 60000;

export class AssetHandlerV2 extends MystikoHandler implements AssetHandler {
  constructor(context: MystikoContextInterface) {
    super(context);
    this.context.assets = this;
  }

  public assets(chainId: number): Promise<string[]> {
    return this.getCommitments([CommitmentStatus.INCLUDED], { chainId }).then((commitments) => {
      const assetSymbols = new Set<string>(commitments.map((c) => c.assetSymbol));
      return Array.from(assetSymbols.values());
    });
  }

  public balance(options: AssetBalanceOptions): Promise<AssetBalance> {
    const multiOptions: AssetMultipleBalanceOptions = {
      assets: [options.asset],
      chainId: options.chainId,
      bridgeType: options.bridgeType,
      shieldedAddress: options.shieldedAddress,
      contractAddress: options.contractAddress,
    };
    return this.balances(multiOptions).then((multiBalances) => {
      const balance = multiBalances.get(options.asset);
      if (balance) {
        return balance;
      }
      return { unspentTotal: 0, pendingTotal: 0, unconfirmedTotal: 0 };
    });
  }

  public balances(options?: AssetMultipleBalanceOptions): Promise<Map<string, AssetBalance>> {
    return this.getCommitments(
      [
        CommitmentStatus.SRC_PENDING,
        CommitmentStatus.SRC_SUCCEEDED,
        CommitmentStatus.QUEUED,
        CommitmentStatus.INCLUDED,
      ],
      options,
    ).then((commitments) => {
      const assets = new Map<string, Commitment[]>();
      const balances = new Map<string, AssetBalance>();
      commitments.forEach((commitment) => {
        const assetCommitments = assets.get(commitment.assetSymbol);
        if (assetCommitments) {
          assetCommitments.push(commitment);
        } else {
          assets.set(commitment.assetSymbol, [commitment]);
        }
      });
      assets.forEach((assetCommitments, assetSymbol) => {
        const unspentTotal = this.calculateCommitmentAmountTotal(
          assetCommitments.filter((c) => c.status === CommitmentStatus.INCLUDED),
        );
        const pendingTotal = this.calculateCommitmentAmountTotal(
          assetCommitments.filter(
            (c) => c.status === CommitmentStatus.SRC_SUCCEEDED || c.status === CommitmentStatus.QUEUED,
          ),
        );
        const unconfirmedTotal = this.calculateCommitmentAmountTotal(
          assetCommitments.filter((c) => c.status === CommitmentStatus.SRC_PENDING),
        );
        balances.set(assetSymbol, { unspentTotal, pendingTotal, unconfirmedTotal });
      });
      return balances;
    });
  }

  public bridges(chainId: number, assetSymbol: string): Promise<BridgeType[]> {
    return this.getCommitments([CommitmentStatus.INCLUDED], { assets: [assetSymbol], chainId }).then(
      (commitments) => {
        const bridgeTypes = new Set<BridgeType>();
        for (let i = 0; i < commitments.length; i += 1) {
          const commitment = commitments[i];
          const bridgeType = this.config
            .getChainConfig(commitment.chainId)
            ?.getPoolContractBridgeType(commitment.contractAddress);
          if (bridgeType) {
            bridgeTypes.add(bridgeType);
          }
        }
        return Array.from(bridgeTypes.values());
      },
    );
  }

  public chains(): Promise<Chain[]> {
    return this.getCommitments([CommitmentStatus.INCLUDED])
      .then((commitments) => {
        const chainIds = new Set<number>(commitments.map((c) => c.chainId));
        const chainPromises: Promise<Chain | null>[] = [];
        chainIds.forEach((chainId) => {
          chainPromises.push(this.context.chains.findOne(chainId));
        });
        return Promise.all(chainPromises);
      })
      .then((chains: Array<Chain | null>) => {
        const filteredChains: Chain[] = [];
        chains.forEach((chain) => {
          if (chain) {
            filteredChains.push(chain);
          }
        });
        return filteredChains;
      });
  }

  public pools(chainId: number, assetSymbol: string, bridgeType: BridgeType): Promise<PoolContractConfig[]> {
    const poolContractConfigs = this.config.getPoolContractConfigs(chainId, assetSymbol, bridgeType);
    if (poolContractConfigs.length > 0) {
      poolContractConfigs.sort((c1, c2) => c2.version - c1.version);
      return this.getCommitments([CommitmentStatus.INCLUDED], {
        assets: [assetSymbol],
        chainId,
        bridgeType,
      }).then((commitments) => {
        const addresses = new Set<string>();
        commitments.forEach((commitment) => addresses.add(commitment.contractAddress));
        return poolContractConfigs.filter((config) => addresses.has(config.address));
      });
    }
    return Promise.resolve([]);
  }

  public async import(options: AssetImportOptions): Promise<Commitment[]> {
    await this.context.wallets.checkPassword(options.walletPassword);
    const chains = Array.isArray(options.chain) ? options.chain : [options.chain];
    const commitments = await this.importFromProviders(options, chains);
    if (commitments.length > 0) {
      const updatedCommitments = await this.context.executors.getCommitmentExecutor().decrypt({
        commitments,
        walletPassword: options.walletPassword,
      });
      const decryptedCommitments = updatedCommitments.filter(
        (commitment) => commitment.serialNumber !== undefined,
      );
      updatedCommitments
        .filter((commitment) => commitment.serialNumber === undefined)
        .forEach((commitment) => {
          this.logger.warn(
            `failed to decrypt commitment=${commitment.commitmentHash}` +
              ` from chainId=${commitment.chainId} and contractAddress=${commitment.contractAddress}`,
          );
        });
      return this.checkCommitmentsSpent(
        decryptedCommitments,
        options.walletPassword,
        options.providerTimeoutMs,
        true,
      );
    }
    return [];
  }

  public async sync(options: AssetSyncOptions): Promise<Map<string, Map<string, AssetBalance>>> {
    await this.context.wallets.checkPassword(options.walletPassword);
    const commitments = await this.getCommitments([
      CommitmentStatus.SRC_PENDING,
      CommitmentStatus.SRC_SUCCEEDED,
      CommitmentStatus.QUEUED,
      CommitmentStatus.INCLUDED,
    ]);
    const importOptions: Map<number, AssetChainImportOptions> = new Map();
    const commitmentsToUpdate: Commitment[] = [];
    const commitmentsToImportFromProvider: Commitment[] = [];
    const commitmentsToImportFromCommitmentHash: Commitment[] = [];
    commitments.forEach((commitment) => {
      if (commitment.leafIndex === undefined && commitment.creationTransactionHash) {
        const chainOptions = importOptions.get(commitment.chainId);
        if (chainOptions) {
          const txHashes = Array.isArray(chainOptions.txHash) ? chainOptions.txHash : [chainOptions.txHash];
          if (!txHashes.includes(commitment.creationTransactionHash)) {
            txHashes.push(commitment.creationTransactionHash);
          }
          chainOptions.txHash = txHashes;
        } else {
          importOptions.set(commitment.chainId, {
            chainId: commitment.chainId,
            txHash: commitment.creationTransactionHash,
          });
        }
        commitmentsToImportFromProvider.push(commitment);
      } else if (commitment.leafIndex === undefined && !commitment.creationTransactionHash) {
        commitmentsToImportFromCommitmentHash.push(commitment);
      } else {
        commitmentsToUpdate.push(commitment);
      }
    });
    const importedCommitmentsFromProvider = await this.import({
      chain: Array.from(importOptions.values()),
      providerTimeoutMs: options.providerTimeoutMs,
      walletPassword: options.walletPassword,
    });
    const importedCommitmentsFromProviderSet = new Set<string>(
      importedCommitmentsFromProvider.map((c) => `${c.chainId}/${c.contractAddress}/${c.commitmentHash}`),
    );
    commitmentsToImportFromProvider.forEach((c) => {
      if (!importedCommitmentsFromProviderSet.has(`${c.chainId}/${c.contractAddress}/${c.commitmentHash}`)) {
        commitmentsToImportFromCommitmentHash.push(c);
      }
    });
    await this.importFromCommitmentHashes(
      options.walletPassword,
      commitmentsToImportFromCommitmentHash,
      options.providerTimeoutMs,
    );
    await Promise.all(
      commitmentsToUpdate.map((commitment) => this.syncCommitmentStatus(commitment, options)),
    );
    const accounts = await this.context.accounts.find();
    const accountsBalances = await Promise.all(
      accounts.map((account) =>
        this.balances({ shieldedAddress: account.shieldedAddress }).then((balances) => ({
          shieldedAddress: account.shieldedAddress,
          balances,
        })),
      ),
    );
    const balances = new Map<string, Map<string, AssetBalance>>();
    accountsBalances.forEach((accountBalances) => {
      balances.set(accountBalances.shieldedAddress, accountBalances.balances);
    });
    return balances;
  }

  private defaultShieldedAddresses(): Promise<string[]> {
    return this.context.accounts
      .find()
      .then((accounts) => accounts.map((account) => account.shieldedAddress));
  }

  private getCommitments(
    statuses?: CommitmentStatus[],
    options?: AssetMultipleBalanceOptions,
  ): Promise<Commitment[]> {
    return this.defaultShieldedAddresses().then((defaultShieldedAddresses) => {
      let shieldedAddresses: string[] = [];
      if (options && options.shieldedAddress) {
        const addresses =
          options.shieldedAddress instanceof Array ? options.shieldedAddress : [options.shieldedAddress];
        addresses.forEach((address) => {
          const index = defaultShieldedAddresses.indexOf(address);
          if (index >= 0) {
            shieldedAddresses.push(address);
          }
        });
      } else {
        shieldedAddresses = defaultShieldedAddresses;
      }
      const commitmentSelector: any = {
        shieldedAddress: { $in: shieldedAddresses },
      };
      if (options && options.assets && options.assets.length > 0) {
        commitmentSelector.assetSymbol = { $in: options.assets };
      }
      if (options && options.chainId) {
        if (options.chainId instanceof Array && options.chainId.length > 0) {
          commitmentSelector.chainId = { $in: options.chainId };
        } else if (!(options.chainId instanceof Array)) {
          commitmentSelector.chainId = options.chainId;
        }
      }
      if (options && options.contractAddress) {
        if (options.contractAddress instanceof Array && options.contractAddress.length > 0) {
          commitmentSelector.contractAddress = { $in: options.contractAddress };
        } else if (!(options.contractAddress instanceof Array)) {
          commitmentSelector.contractAddress = options.contractAddress;
        }
      }
      if (statuses && statuses.length > 0) {
        commitmentSelector.status = { $in: statuses };
      }
      let bridges: BridgeType[] | undefined;
      if (options && options.bridgeType) {
        if (options.bridgeType instanceof Array && options.bridgeType.length > 0) {
          bridges = options.bridgeType;
        } else if (!(options.bridgeType instanceof Array)) {
          bridges = [options.bridgeType];
        }
      }
      return this.context.commitments.find({ selector: commitmentSelector }).then((commitments) =>
        commitments.filter((c) => {
          const chainConfig = this.config.getChainConfig(c.chainId);
          const contractConfig = chainConfig?.getPoolContractByAddress(c.contractAddress);
          const bridgeType = chainConfig?.getPoolContractBridgeType(c.contractAddress);
          if (bridges) {
            return !!bridgeType && bridges.indexOf(bridgeType) !== -1;
          }
          return !!chainConfig && !!contractConfig && !!bridgeType;
        }),
      );
    });
  }

  private calculateCommitmentAmountTotal(commitments: Commitment[]) {
    const total = commitments
      .map((c) => (c.amount ? toBN(c.amount) : toBN(0)))
      .reduce((c1, c2) => c1.add(c2), toBN(0));
    const decimal = commitments.length > 0 ? commitments[0].assetDecimals : undefined;
    return fromDecimals(total, decimal);
  }

  private async importFromCommitmentHashes(
    walletPassword: string,
    commitments: Commitment[],
    timeoutMs?: number,
  ): Promise<Commitment[]> {
    const sequencerExecutor = this.context.executors.getSequencerExecutor();
    if (sequencerExecutor && commitments.length > 0) {
      const optionsMap: Map<number, Map<string, ImportByCommitmentHashesOptions>> = new Map();
      commitments.forEach((commitment) => {
        const chainOptions = optionsMap.get(commitment.chainId);
        if (chainOptions) {
          const contractOptions = chainOptions.get(commitment.contractAddress);
          if (contractOptions) {
            contractOptions.commitmentHashes.push(toBN(commitment.commitmentHash));
          } else {
            chainOptions.set(commitment.contractAddress, {
              walletPassword,
              chainId: commitment.chainId,
              contractAddress: commitment.contractAddress,
              commitmentHashes: [toBN(commitment.commitmentHash)],
              timeoutMs,
            });
          }
        } else {
          const newChainOptions: Map<string, ImportByCommitmentHashesOptions> = new Map();
          newChainOptions.set(commitment.contractAddress, {
            walletPassword,
            chainId: commitment.chainId,
            contractAddress: commitment.contractAddress,
            commitmentHashes: [toBN(commitment.commitmentHash)],
            timeoutMs,
          });
          optionsMap.set(commitment.chainId, newChainOptions);
        }
      });
      const options = Array.from(optionsMap.values())
        .map((chainOptions) => Array.from(chainOptions.values()))
        .flat();
      const commitmentPromises = options.map((o) => sequencerExecutor.importByCommitmentHashes(o));
      const importedCommitments = (await Promise.all(commitmentPromises)).flat();
      if (importedCommitments.length > 0) {
        const updatedCommitments = await this.context.executors.getCommitmentExecutor().decrypt({
          commitments: importedCommitments,
          walletPassword,
        });
        return this.checkCommitmentsSpent(updatedCommitments, walletPassword, timeoutMs);
      }
    }
    return [];
  }

  private async importFromProviders(
    options: AssetImportOptions,
    chainOptions: AssetChainImportOptions[],
  ): Promise<Commitment[]> {
    const tasks = await Promise.all(chainOptions.map((c) => this.importChainFromProviders(options, c)));
    return tasks.flat();
  }

  private async importChainFromProviders(
    options: AssetImportOptions,
    chainOptions: AssetChainImportOptions,
  ): Promise<Commitment[]> {
    const provider = await this.context.providers.getProvider(chainOptions.chainId);
    if (provider) {
      const txHash = Array.isArray(chainOptions.txHash) ? chainOptions.txHash : [chainOptions.txHash];
      const txReceiptTasks = txHash.map(async (hash) => {
        const txReceipt = await promiseWithTimeout(
          provider.getTransactionReceipt(hash),
          options.providerTimeoutMs || DEFAULT_PROVIDER_QUERY_TIMEOUT_MS,
        );
        if (txReceipt && txReceipt.blockNumber) {
          return this.importTxReceiptFromProvider(options, chainOptions, txReceipt, provider);
        }
        return Promise.resolve([]);
      });
      const commitments = await Promise.all(txReceiptTasks);
      return commitments.flat();
    }
    return Promise.resolve([]);
  }

  private async importTxReceiptFromProvider(
    options: AssetImportOptions,
    chainOptions: AssetChainImportOptions,
    txReceipt: ethers.providers.TransactionReceipt,
    provider: ethers.providers.Provider,
  ): Promise<Commitment[]> {
    const contractAddress = txReceipt.to;
    let contractConfig: PoolContractConfig | undefined;
    let contract: CommitmentPool | undefined;
    const depositContractConfig = this.config.getDepositContractConfigByAddress(
      chainOptions.chainId,
      contractAddress,
    );
    if (depositContractConfig && depositContractConfig.bridgeType === BridgeType.LOOP) {
      contract = this.context.contractConnector.connect<CommitmentPool>(
        'CommitmentPool',
        depositContractConfig.poolAddress,
        provider,
      );
      contractConfig = depositContractConfig.poolContract;
    } else {
      const matchingLog = txReceipt.logs.find((log) =>
        this.config.getPoolContractConfigByAddress(chainOptions.chainId, log.address),
      );

      if (matchingLog) {
        const poolContractConfig = this.config.getPoolContractConfigByAddress(
          chainOptions.chainId,
          matchingLog.address,
        );
        contract = this.context.contractConnector.connect<CommitmentPool>(
          'CommitmentPool',
          matchingLog.address,
          provider,
        );
        contractConfig = poolContractConfig;
      }
    }
    if (contract && contractConfig) {
      const includedCount = (
        await promiseWithTimeout(
          contract.getCommitmentIncludedCount(),
          options.providerTimeoutMs || DEFAULT_PROVIDER_QUERY_TIMEOUT_MS,
        )
      ).toNumber();
      const queuedTopic = contract.interface.getEventTopic('CommitmentQueued');
      const queuedEvents: CommitmentQueuedEvent[] = [];
      const includedEvents: CommitmentIncludedEvent[] = [];
      for (let i = 0; i < txReceipt.logs.length; i += 1) {
        const log = txReceipt.logs[i];
        if (log.topics.length > 0 && log.topics[0] === queuedTopic) {
          const queuedEvent = contract?.interface.parseLog(log);
          if (queuedEvent.args.leafIndex.toNumber() < includedCount) {
            includedEvents.push({
              eventType: EventType.COMMITMENT_INCLUDED,
              contractAddress: contractConfig.address,
              transactionHash: txReceipt.transactionHash,
              commitmentHash: queuedEvent.args.commitment,
              leafIndex: queuedEvent.args.leafIndex,
              rollupFee: queuedEvent.args.rollupFee,
              encryptedNote: queuedEvent.args.encryptedNote,
              queuedTransactionHash: txReceipt.transactionHash,
            });
          } else {
            queuedEvents.push({
              eventType: EventType.COMMITMENT_QUEUED,
              contractAddress: contractConfig.address,
              transactionHash: txReceipt.transactionHash,
              commitmentHash: queuedEvent.args.commitment,
              leafIndex: queuedEvent.args.leafIndex,
              rollupFee: queuedEvent.args.rollupFee,
              encryptedNote: queuedEvent.args.encryptedNote,
            });
          }
        }
      }
      return this.context.executors.getEventExecutor().import([...queuedEvents, ...includedEvents], {
        chainId: chainOptions.chainId,
        walletPassword: options.walletPassword,
      });
    }
    return Promise.resolve([]);
  }

  private async checkCommitmentsSpent(
    commitments: Commitment[],
    walletPassword: string,
    providerTimeoutMs?: number,
    logSpent?: boolean,
  ): Promise<Commitment[]> {
    const updatedCommitments = await Promise.all(
      commitments.map((commitment) =>
        this.checkCommitmentSpent(commitment, walletPassword, providerTimeoutMs),
      ),
    );
    if (logSpent) {
      updatedCommitments.forEach((updatedCommitment) => {
        if (updatedCommitment.status === CommitmentStatus.SPENT) {
          this.logger.warn(
            `commitment=${updatedCommitment.commitmentHash} ` +
              `from chainId=${updatedCommitment.chainId} and contractAddress=${updatedCommitment.contractAddress} ` +
              `is spent with nullifier=${updatedCommitment.serialNumber}`,
          );
        }
      });
    }
    return updatedCommitments.filter((c) => c.shieldedAddress && c.status !== CommitmentStatus.SPENT);
  }

  private async checkCommitmentSpent(
    commitment: Commitment,
    walletPassword: string,
    providerTimeoutMs?: number,
  ): Promise<Commitment> {
    let decryptedCommitment = commitment;
    if (decryptedCommitment.serialNumber === undefined) {
      const decryptedCommitments = await this.context.executors.getCommitmentExecutor().decrypt({
        commitments: [commitment],
        walletPassword,
      });
      decryptedCommitment = decryptedCommitments.length > 0 ? decryptedCommitments[0] : decryptedCommitment;
    }
    const { serialNumber } = decryptedCommitment;
    if (serialNumber) {
      const isSpent = await this.isKnowNullifierFromProvider(
        commitment.chainId,
        commitment.contractAddress,
        serialNumber,
        providerTimeoutMs,
      );
      if (isSpent) {
        const updatedCommitment = commitment.atomicUpdate((commitmentData) => {
          commitmentData.status = CommitmentStatus.SPENT;
          commitmentData.updatedAt = MystikoHandler.now();
          return commitmentData;
        });
        const transactions = await this.context.transactions.find({
          selector: {
            chainId: commitment.chainId,
            contractAddress: commitment.contractAddress,
            status: { $ne: TransactionStatus.SUCCEEDED },
          },
        });
        const filteredTransactions = transactions
          .filter((tx) => tx.serialNumbers && tx.serialNumbers.includes(serialNumber))
          .map((tx) => tx.toMutableJSON());
        filteredTransactions.forEach((tx) => {
          tx.status = TransactionStatus.SUCCEEDED;
          tx.updatedAt = MystikoHandler.now();
        });
        if (filteredTransactions.length > 0) {
          await this.context.db.transactions.bulkUpsert(filteredTransactions);
        }
        return updatedCommitment;
      }
    }
    return commitment;
  }

  private async isKnowNullifierFromProvider(
    chainId: number,
    contractAddress: string,
    nullifier: string,
    providerTimeoutMs?: number,
  ): Promise<boolean> {
    const provider = await this.context.providers.getProvider(chainId);
    if (provider) {
      const contract = this.context.contractConnector.connect<CommitmentPool>(
        'CommitmentPool',
        contractAddress,
        provider,
      );
      return promiseWithTimeout(
        contract.isSpentSerialNumber(nullifier),
        providerTimeoutMs || DEFAULT_PROVIDER_QUERY_TIMEOUT_MS,
      );
    }
    return false;
  }

  private async syncCommitmentStatus(commitment: Commitment, options: AssetSyncOptions): Promise<Commitment> {
    const provider = await this.context.providers.getProvider(commitment.chainId);
    if (provider) {
      return this.syncCommitmentStatusFromProvider(provider, commitment, options);
    }
    return commitment;
  }

  private async syncCommitmentStatusFromProvider(
    provider: ethers.providers.Provider,
    commitment: Commitment,
    options: AssetSyncOptions,
  ): Promise<Commitment> {
    if (commitment.status === CommitmentStatus.QUEUED) {
      const contract = this.context.contractConnector.connect<CommitmentPool>(
        'CommitmentPool',
        commitment.contractAddress,
        provider,
      );
      const includedCount = toBN(
        (
          await promiseWithTimeout(
            contract.getCommitmentIncludedCount(),
            options?.providerTimeoutMs || DEFAULT_PROVIDER_QUERY_TIMEOUT_MS,
          )
        ).toNumber(),
      );
      if (
        commitment.leafIndex &&
        toBN(commitment.leafIndex).lt(includedCount) &&
        commitment.creationTransactionHash
      ) {
        const includedEvent: CommitmentIncludedEvent = {
          eventType: EventType.COMMITMENT_INCLUDED,
          contractAddress: commitment.contractAddress,
          commitmentHash: commitment.commitmentHash,
          transactionHash: commitment.creationTransactionHash,
          leafIndex: undefined,
          encryptedNote: undefined,
          rollupFee: undefined,
          queuedTransactionHash: undefined,
        };
        const updatedCommitments = await this.context.executors.getEventExecutor().import([includedEvent], {
          chainId: commitment.chainId,
          walletPassword: options.walletPassword,
        });
        return updatedCommitments[0];
      }
    } else if (commitment.status === CommitmentStatus.INCLUDED) {
      return this.checkCommitmentSpent(commitment, options.walletPassword, options?.providerTimeoutMs);
    }
    return commitment;
  }
}
