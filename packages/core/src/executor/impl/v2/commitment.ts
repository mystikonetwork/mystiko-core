import { ChainConfig, DepositContractConfig, PoolContractConfig } from '@mystikonetwork/config';
import {
  CommitmentPool,
  SupportedContractType,
  TypedEvent,
  TypedEventFilter,
} from '@mystikonetwork/contracts-abi';
import {
  Account,
  AccountStatus,
  Chain,
  Commitment,
  CommitmentStatus,
  CommitmentType,
  Contract,
  DatabaseQuery,
  Nullifier,
} from '@mystikonetwork/database';
import { MystikoProtocolV2 } from '@mystikonetwork/protocol';
import { errorMessage, promiseWithTimeout, toBN } from '@mystikonetwork/utils';
import { ethers } from 'ethers';
import { MystikoHandler } from '../../../handler';
import {
  CommitmentCheck,
  CommitmentDecrypt,
  CommitmentExecutor,
  CommitmentImport,
  CommitmentIncludedEvent,
  CommitmentQueuedEvent,
  CommitmentScan,
  CommitmentScanAll,
  CommitmentSpentEvent,
  ContractEvent,
  EventType,
} from '../../../interface';
import { CommitmentUtils } from '../../../utils';
import { MystikoExecutor } from '../../executor';

type CheckContext = {
  options: CommitmentCheck;
};

type CheckChainContext = CheckContext & {
  chainConfig: ChainConfig;
  chain: Chain;
};

type CheckContractContext = CheckChainContext & {
  contractConfig: PoolContractConfig | DepositContractConfig;
  contract: Contract;
};

type ImportContext = {
  options: CommitmentImport;
};

type ImportChainContext = ImportContext & {
  chainConfig: ChainConfig;
  provider: ethers.providers.Provider;
  currentBlock: number;
};

type ImportContractContext = ImportChainContext & {
  contractConfig: PoolContractConfig | DepositContractConfig;
  contract: Contract;
};

type ImportEventsContext = ImportContractContext & {
  fromBlock: number;
  toBlock: number;
};

type ScanContext = {
  options: CommitmentScan;
  account: Account;
};

export class CommitmentExecutorV2 extends MystikoExecutor implements CommitmentExecutor {
  public check(options: CommitmentCheck): Promise<void> {
    return this.checkAll({ options });
  }

  public import(options: CommitmentImport): Promise<Commitment[]> {
    return this.context.wallets.checkPassword(options.walletPassword).then(() => this.importAll({ options }));
  }

  public scanAll(options: CommitmentScanAll): Promise<Commitment[][]> {
    return this.context.wallets
      .checkPassword(options.walletPassword)
      .then(() => this.context.accounts.find())
      .then((accounts) => {
        const promises: Promise<Commitment[]>[] = [];
        accounts.forEach((account) => {
          promises.push(
            this.scanAccountWrapper(account, {
              shieldedAddress: account.shieldedAddress,
              walletPassword: options.walletPassword,
            }),
          );
        });
        return Promise.all(promises);
      });
  }

  public scan(options: CommitmentScan): Promise<Commitment[]> {
    const { shieldedAddress, walletPassword } = options;
    return this.context.wallets.checkPassword(walletPassword).then(() =>
      this.context.accounts.findOne(shieldedAddress).then((account) => {
        if (account) {
          return this.scanAccountWrapper(account, options);
        }
        return Promise.resolve([]);
      }),
    );
  }

  public decrypt(options: CommitmentDecrypt): Promise<Commitment[]> {
    return this.decryptCommitments(options).then(({ decryptedCommitments, encryptedCommitments }) => [
      ...decryptedCommitments,
      ...encryptedCommitments,
    ]);
  }

  private decryptCommitments(
    options: CommitmentDecrypt,
  ): Promise<{ decryptedCommitments: Commitment[]; encryptedCommitments: Commitment[] }> {
    const { commitments, accounts, walletPassword } = options;
    const accountsPromise: Promise<Account[]> = accounts
      ? Promise.resolve(accounts)
      : this.context.accounts.find();
    return accountsPromise
      .then((myAccounts) => {
        const commitmentsMap: { [key: string]: Commitment[] } = {};
        const protocol = this.protocol as MystikoProtocolV2;
        const keys = myAccounts.map((account) => {
          const { publicKey } = account;
          const secretKey = account.secretKey(protocol, walletPassword);
          return { publicKey, secretKey };
        });
        const commitmentsToEncrypt: { commitmentHash: string; encryptedNote: string }[] = [];
        commitments.forEach((commitment) => {
          if (commitment.encryptedNote) {
            commitmentsToEncrypt.push({
              commitmentHash: commitment.commitmentHash,
              encryptedNote: commitment.encryptedNote,
            });
          }
          if (commitment.commitmentHash in commitmentsMap) {
            commitmentsMap[commitment.commitmentHash].push(commitment);
          } else {
            commitmentsMap[commitment.commitmentHash] = [commitment];
          }
        });
        return protocol.decryptNotes(commitmentsToEncrypt, keys).then((decryptOutputs) => {
          const decryptedCommitments: CommitmentType[] = [];
          decryptOutputs.forEach((decryptOutput) => {
            const commitmentHash = decryptOutput.commitment.commitmentHash.toString();
            if (commitmentHash in commitmentsMap) {
              commitmentsMap[commitmentHash].forEach((commitment) => {
                const updatedCommitment = commitment.toMutableJSON();
                updatedCommitment.serialNumber = decryptOutput.serialNumber.toString();
                updatedCommitment.amount = decryptOutput.commitment.amount.toString();
                updatedCommitment.shieldedAddress = decryptOutput.shieldedAddress;
                updatedCommitment.updatedAt = MystikoHandler.now();
                decryptedCommitments.push(updatedCommitment);
              });
              delete commitmentsMap[commitmentHash];
            }
          });
          const encryptedCommitments = Object.values(commitmentsMap).flat();
          return Promise.resolve({ decryptedCommitments, encryptedCommitments });
        });
      })
      .then(({ decryptedCommitments, encryptedCommitments }) =>
        this.context.db.commitments
          .bulkUpsert(decryptedCommitments)
          .then((updatedCommitments) => ({ decryptedCommitments: updatedCommitments, encryptedCommitments })),
      );
  }

  private checkAll(checkContext: CheckContext): Promise<void> {
    const promises: Promise<void>[] = [];
    const { options } = checkContext;
    const { chainId } = options;
    for (let i = 0; i < this.config.chains.length; i += 1) {
      const chainConfig = this.config.chains[i];
      if (!chainId || chainId === chainConfig.chainId) {
        promises.push(
          this.context.chains.findOne(chainConfig.chainId).then((chain) => {
            if (chain) {
              return this.checkChain({ ...checkContext, chain, chainConfig });
            }
            return Promise.resolve();
          }),
        );
      }
    }
    return Promise.all(promises).then(() => {});
  }

  private checkChain(checkContext: CheckChainContext): Promise<void> {
    const promises: Promise<void>[] = [];
    const { chainConfig } = checkContext;
    const { chainId, contractAddress } = checkContext.options;
    const { poolContracts, depositContracts } = chainConfig;
    const contracts: Array<PoolContractConfig | DepositContractConfig> = [
      ...poolContracts,
      ...depositContracts,
    ];
    for (let i = 0; i < contracts.length; i += 1) {
      const contractConfig = contracts[i];
      if (
        !chainId ||
        !contractAddress ||
        (contractAddress === contractConfig.address && chainId === chainConfig.chainId)
      ) {
        promises.push(
          this.context.contracts
            .findOne({ chainId: chainConfig.chainId, address: contractConfig.address })
            .then((contract) => {
              if (contract) {
                return this.checkContract({ ...checkContext, contract, contractConfig });
              }
              return Promise.resolve();
            }),
        );
      }
    }
    return Promise.all(promises).then(() => {});
  }

  private checkContract(checkContext: CheckContractContext): Promise<void> {
    const { chainConfig, contractConfig, contract } = checkContext;
    return this.context.commitments
      .find({
        selector: {
          chainId: chainConfig.chainId,
          contractAddress: contractConfig.address,
          status: { $in: [CommitmentStatus.INCLUDED, CommitmentStatus.SPENT] },
          leafIndex: { $gte: contract.checkedLeafIndex ? contract.checkedLeafIndex + 1 : 0 },
        },
      })
      .then((commitments) => {
        const sorted = CommitmentUtils.sortByLeafIndex(commitments, false);
        const lastIndex = sorted.length > 0 ? sorted.length - 1 : undefined;
        for (let i = 0; i < sorted.length; i += 1) {
          const { leafIndex, commitmentHash } = sorted[i];
          if (!leafIndex || !toBN(leafIndex).eqn(i)) {
            this.logger.warn(
              `corrupted commitment data of chainId=${chainConfig.chainId}, ` +
                `contractAddress=${contractConfig.address}, commitmentHash=${commitmentHash}, ` +
                `leafIndex expected=${i} vs actual=${leafIndex}`,
            );
            return { isValid: false, lastIndex };
          }
        }
        return { isValid: true, lastIndex };
      })
      .then(({ isValid, lastIndex }) => {
        if (!isValid) {
          return this.context.contracts.resetSync(contract.id).then(() => {});
        }
        return contract
          .atomicUpdate((data) => {
            if (lastIndex) {
              data.checkedLeafIndex = lastIndex;
              data.updatedAt = MystikoHandler.now();
            }
            return data;
          })
          .then(() => {});
      });
  }

  private importAll(importContext: ImportContext): Promise<Commitment[]> {
    const promises: Promise<Commitment[]>[] = [];
    const { options } = importContext;
    const { chainId } = options;
    for (let i = 0; i < this.config.chains.length; i += 1) {
      const chainConfig = this.config.chains[i];
      if (!chainId || chainId === chainConfig.chainId) {
        promises.push(
          this.context.providers.getProvider(chainConfig.chainId).then((provider) => {
            if (provider) {
              let promise = provider.getBlockNumber();
              if (options.timeoutMs) {
                promise = promiseWithTimeout(promise, options.timeoutMs);
              }
              return promise.then((currentBlock) =>
                this.importChain({
                  ...importContext,
                  chainConfig,
                  provider,
                  currentBlock: Math.max(0, currentBlock - chainConfig.eventFilterBlockBackoff),
                }),
              );
            }
            /* istanbul ignore next */
            return [];
          }),
        );
      }
    }
    return Promise.all(promises)
      .then((commitments) => commitments.flat())
      .then((commitments) => {
        this.logger.info(
          `import(${CommitmentExecutorV2.formatOptions(options)}) is done, ` +
            `imported ${commitments.length} commitments`,
        );
        return commitments;
      });
  }

  private importChain(importContext: ImportChainContext): Promise<Commitment[]> {
    const promises: Promise<{ context: ImportEventsContext; events: ContractEvent[] } | undefined>[] = [];
    const { chainConfig, options } = importContext;
    const { chainId, contractAddress } = importContext.options;
    const { poolContracts, depositContracts } = chainConfig;
    const contracts: Array<PoolContractConfig | DepositContractConfig> = [
      ...poolContracts,
      ...depositContracts,
    ];
    return this.context.chains.findOne(chainConfig.chainId).then((chain) => {
      if (chain) {
        this.logger.info(`importing commitment related events from chain id=${chainConfig.chainId}`);
        for (let i = 0; i < contracts.length; i += 1) {
          const contractConfig = contracts[i];
          if (
            !chainId ||
            !contractAddress ||
            (contractAddress === contractConfig.address && chainId === chainConfig.chainId)
          ) {
            promises.push(
              this.context.contracts
                .findOne({ chainId: chainConfig.chainId, address: contractConfig.address })
                .then((contract) => {
                  if (contract) {
                    return this.importContract({
                      ...importContext,
                      contractConfig,
                      contract,
                    });
                  }
                  /* istanbul ignore next */
                  return Promise.resolve(undefined);
                }),
            );
          }
        }
        let promise = Promise.all(promises);
        if (options.timeoutMs) {
          promise = promiseWithTimeout(promise, options.timeoutMs);
        }
        return promise
          .then((contextWithEvents) => {
            const filteredContextWithEvents: { context: ImportEventsContext; events: ContractEvent[] }[] = [];
            contextWithEvents.forEach((contextWithEvent) => {
              if (contextWithEvent) {
                filteredContextWithEvents.push(contextWithEvent);
              }
            });
            const minToBlock = Math.min(...filteredContextWithEvents.map(({ context }) => context.toBlock));
            return this.saveChainEvents(0, filteredContextWithEvents).then((commitments) => ({
              commitments,
              toBlock: minToBlock,
            }));
          })
          .then(({ commitments, toBlock }) =>
            chain
              .atomicUpdate((data) => {
                data.syncedBlockNumber = toBlock;
                data.updatedAt = MystikoHandler.now();
                return data;
              })
              .then(() => commitments),
          )
          .then((commitments) => {
            this.logger.info(
              `successfully imported commitment related events from chain id=${chainConfig.chainId}`,
            );
            return commitments;
          })
          .catch((error) => {
            this.logger.error(
              `failed to import commitment related events from chain id=${
                chainConfig.chainId
              }, errorMessage=${errorMessage(error)}`,
            );
            return Promise.reject(error);
          });
      }
      return Promise.resolve([]);
    });
  }

  private importContract(
    importContext: ImportContractContext,
  ): Promise<{ context: ImportEventsContext; events: ContractEvent[] }> {
    const { chainConfig, contractConfig, contract, currentBlock } = importContext;
    this.logger.debug(
      'importing commitment related events from ' +
        `chain id=${chainConfig.chainId} contract address=${contractConfig.address}`,
    );
    const syncedBlock =
      contract.syncedBlockNumber < contract.syncStart ? contract.syncStart : contract.syncedBlockNumber;
    const fromBlock = syncedBlock + 1;
    const toBlock =
      fromBlock + contract.syncSize - 1 > currentBlock ? currentBlock : fromBlock + contract.syncSize - 1;
    const eventsContext: ImportEventsContext = { ...importContext, fromBlock, toBlock };
    return this.importContractEvents(eventsContext).then((result) => {
      eventsContext.toBlock = result.context.toBlock;
      return { context: eventsContext, events: result.events };
    });
  }

  private importContractEvents(
    importContext: ImportEventsContext,
  ): Promise<{ context: ImportEventsContext; events: ContractEvent[] }> {
    const { contract, fromBlock, toBlock, currentBlock } = importContext;
    if (fromBlock <= toBlock) {
      const events: Promise<ContractEvent[]>[] = [
        this.importCommitmentQueuedEvents(importContext),
        this.importCommitmentIncludedEvents(importContext),
        this.importCommitmentSpentEvents(importContext),
      ];
      return Promise.all(events)
        .then((fetchedEvents) => fetchedEvents.flat())
        .then((flattenEvents) => {
          const newFromBlock = toBlock + 1;
          const newToBlock =
            toBlock + contract.syncSize > currentBlock ? currentBlock : toBlock + contract.syncSize;
          const newImportContext = { ...importContext, fromBlock: newFromBlock, toBlock: newToBlock };
          return this.importContractEvents(newImportContext).then((result) => ({
            context: result.context,
            events: [...flattenEvents, ...result.events],
          }));
        });
    }
    return Promise.resolve({ context: importContext, events: [] });
  }

  private importCommitmentQueuedEvents(importContext: ImportEventsContext): Promise<CommitmentQueuedEvent[]> {
    const { chainConfig, contractConfig } = importContext;
    if (
      contractConfig instanceof DepositContractConfig ||
      (contractConfig.disabledAt && contractConfig.disabledAt < importContext.fromBlock)
    ) {
      return Promise.resolve([]);
    }
    const etherContract = this.connectPoolContract(importContext);
    return this.importCommitmentEvents(
      importContext,
      etherContract,
      'CommitmentQueued',
      etherContract.filters.CommitmentQueued(),
    ).then((rawEvents) =>
      rawEvents.map((rawEvent) => ({
        eventType: EventType.COMMITMENT_QUEUED,
        chainId: chainConfig.chainId,
        contractAddress: contractConfig.address,
        commitmentHash: rawEvent.args.commitment,
        leafIndex: rawEvent.args.leafIndex,
        rollupFee: rawEvent.args.rollupFee,
        encryptedNote: rawEvent.args.encryptedNote,
        transactionHash: rawEvent.transactionHash,
      })),
    );
  }

  private importCommitmentIncludedEvents(
    importContext: ImportEventsContext,
  ): Promise<CommitmentIncludedEvent[]> {
    const { chainConfig, contractConfig } = importContext;
    if (
      contractConfig instanceof DepositContractConfig ||
      (contractConfig.disabledAt && contractConfig.disabledAt < importContext.fromBlock)
    ) {
      return Promise.resolve([]);
    }
    const etherContract = this.connectPoolContract(importContext);
    return this.importCommitmentEvents(
      importContext,
      etherContract,
      'CommitmentIncluded',
      etherContract.filters.CommitmentIncluded(),
    ).then((rawEvents) =>
      rawEvents.map((rawEvent) => ({
        eventType: EventType.COMMITMENT_INCLUDED,
        chainId: chainConfig.chainId,
        contractAddress: contractConfig.address,
        commitmentHash: rawEvent.args.commitment,
        transactionHash: rawEvent.transactionHash,
        leafIndex: undefined,
        rollupFee: undefined,
        encryptedNote: undefined,
      })),
    );
  }

  private importCommitmentSpentEvents(importContext: ImportEventsContext): Promise<CommitmentSpentEvent[]> {
    const { chainConfig, contractConfig } = importContext;
    if (contractConfig instanceof DepositContractConfig) {
      return Promise.resolve([]);
    }
    const etherContract = this.connectPoolContract(importContext);
    return this.importCommitmentEvents(
      importContext,
      etherContract,
      'CommitmentSpent',
      etherContract.filters.CommitmentSpent(),
    ).then((rawEvents) =>
      rawEvents.map((rawEvent) => ({
        eventType: EventType.COMMITMENT_SPENT,
        chainId: chainConfig.chainId,
        contractAddress: contractConfig.address,
        serialNumber: rawEvent.args.serialNumber,
        transactionHash: rawEvent.transactionHash,
      })),
    );
  }

  private importCommitmentEvents<T extends TypedEvent, C extends SupportedContractType>(
    importContext: ImportEventsContext,
    etherContract: C,
    eventName: string,
    filter: TypedEventFilter<T>,
  ): Promise<T[]> {
    const { contract, chainConfig, fromBlock, toBlock } = importContext;
    this.logger.debug(
      `importing ${eventName} event from ` +
        `chain id=${chainConfig.chainId} contract address=${contract.contractAddress}` +
        ` fromBlock=${fromBlock}, toBlock=${toBlock}`,
    );
    return etherContract.queryFilter(filter, fromBlock, toBlock).then((rawEvents) => {
      if (rawEvents.length > 0) {
        this.logger.info(
          `fetched ${rawEvents.length} ${eventName} event(s) from contract ` +
            `chain id=${chainConfig.chainId} contract address=${contract.contractAddress}`,
        );
      }
      return rawEvents;
    });
  }

  private saveChainEvents(
    index: number,
    contracts: { context: ImportEventsContext; events: ContractEvent[] }[],
  ): Promise<Commitment[]> {
    if (index < contracts.length) {
      const { context, events } = contracts[index];
      return this.saveContractEvents(context, events).then((commitments) =>
        this.saveChainEvents(index + 1, contracts).then((moreCommitments) => [
          ...commitments,
          ...moreCommitments,
        ]),
      );
    }
    return Promise.resolve([]);
  }

  private saveContractEvents(context: ImportEventsContext, events: ContractEvent[]): Promise<Commitment[]> {
    const { chainConfig, options, contract, toBlock } = context;
    return this.context.executors
      .getEventExecutor()
      .import(events, {
        chainId: chainConfig.chainId,
        walletPassword: options.walletPassword,
        skipCheckPassword: true,
      })
      .then((commitments) =>
        contract
          .atomicUpdate((data) => {
            data.syncedBlockNumber = toBlock;
            data.updatedAt = MystikoHandler.now();
            return data;
          })
          .then(() => commitments),
      );
  }

  private connectPoolContract(importContext: ImportContractContext): CommitmentPool {
    const { contractConfig, provider } = importContext;
    return this.context.contractConnector.connect<CommitmentPool>(
      'CommitmentPool',
      contractConfig.address,
      provider,
    );
  }

  private scanAccountWrapper(account: Account, options: CommitmentScan): Promise<Commitment[]> {
    if (account.status !== AccountStatus.SCANNING) {
      this.logger.info(
        `start scanning commitments belong to account=${account.shieldedAddress}` +
          ` from commitmentId=${account.scannedCommitmentId}`,
      );
      return this.context.accounts
        .update(options.walletPassword, account.id, { status: AccountStatus.SCANNING })
        .then(() => this.scanAccount({ options, account }))
        .then((commitments) => {
          this.logger.info(
            `scanned ${commitments.length} commitments belong to account=${account.shieldedAddress}`,
          );
          return this.context.accounts
            .update(options.walletPassword, account.id, { status: AccountStatus.SCANNED })
            .then(() => commitments);
        });
    }
    this.logger.warn(`account=${account.shieldedAddress} is currently scanning, skipping this scan`);
    return Promise.resolve([]);
  }

  private scanAccount(scanContext: ScanContext): Promise<Commitment[]> {
    const { options, account } = scanContext;
    const { scannedCommitmentId } = account;
    const { scanSize } = account;
    const query: DatabaseQuery<Commitment> = {
      selector: {
        status: { $in: [CommitmentStatus.QUEUED, CommitmentStatus.INCLUDED] },
      },
      sort: [{ id: 'asc' }],
      limit: scanSize,
    };
    if (scannedCommitmentId && query.selector) {
      query.selector.id = { $gt: scannedCommitmentId };
    }
    return this.context.commitments
      .find(query)
      .then((commitments) =>
        this.decryptCommitments({
          commitments,
          walletPassword: options.walletPassword,
          accounts: [account],
        }).then(({ decryptedCommitments }) => ({ commitments, decryptedCommitments })),
      )
      .then(({ decryptedCommitments, commitments }) =>
        this.context.nullifiers
          .find({
            selector: { serialNumber: { $in: decryptedCommitments.map((c) => c.serialNumber) } },
          })
          .then((nullifiers) => {
            const nullifierMap: Map<string, Nullifier> = new Map();
            nullifiers.forEach((nullifier) => {
              nullifierMap.set(nullifier.serialNumber, nullifier);
            });
            return nullifierMap;
          })
          .then((nullifierMap) => {
            const commitmentsData: CommitmentType[] = [];
            decryptedCommitments.forEach((commitment) => {
              if (commitment.serialNumber) {
                const nullifier = nullifierMap.get(commitment.serialNumber);
                if (
                  nullifier &&
                  nullifier.chainId === commitment.chainId &&
                  nullifier.contractAddress === commitment.contractAddress
                ) {
                  const commitmentData = commitment.toMutableJSON();
                  commitmentData.status = CommitmentStatus.SPENT;
                  commitmentData.spendingTransactionHash = nullifier.transactionHash;
                  commitmentData.updatedAt = MystikoHandler.now();
                  commitmentsData.push(commitmentData);
                }
              }
            });
            return this.db.commitments.bulkUpsert(commitmentsData);
          })
          .then((updatedCommitments) => ({ updatedCommitments, commitments })),
      )
      .then(({ updatedCommitments, commitments }) =>
        account
          .atomicUpdate((accountData) => {
            if (commitments.length > 0) {
              accountData.scannedCommitmentId = commitments[commitments.length - 1].id;
            }
            accountData.updatedAt = MystikoHandler.now();
            return accountData;
          })
          .then((updatedAccount) => ({ updatedAccount, updatedCommitments, commitments })),
      )
      .then(({ updatedAccount, updatedCommitments, commitments }) => {
        const importedCommitment = updatedCommitments.filter(
          (c) => c.shieldedAddress === account.shieldedAddress,
        );
        if (commitments.length === 0 || commitments.length < scanSize) {
          return importedCommitment;
        }
        this.logger.info(
          `scanned ${importedCommitment.length} commitments for account ${account.shieldedAddress} ` +
            `from commitmentId ${scannedCommitmentId} to ${updatedAccount.scannedCommitmentId}`,
        );
        return this.scanAccount({ account: updatedAccount, options }).then((moreCommitments) => [
          ...importedCommitment,
          ...moreCommitments,
        ]);
      });
  }

  private static formatOptions(options: CommitmentImport): string {
    return JSON.stringify({
      chainId: options.chainId,
      contractAddress: options.contractAddress,
    });
  }
}
