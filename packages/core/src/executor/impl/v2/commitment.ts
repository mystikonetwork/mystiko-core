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
  Commitment,
  CommitmentStatus,
  Contract,
  DatabaseQuery,
} from '@mystikonetwork/database';
import { MystikoProtocolV2 } from '@mystikonetwork/protocol';
import { toBuff } from '@mystikonetwork/utils';
import { ethers } from 'ethers';
import { MystikoHandler } from '../../../handler';
import {
  CommitmentDecrypt,
  CommitmentExecutor,
  CommitmentImport,
  CommitmentScan,
  EventType,
} from '../../../interface';
import { MystikoExecutor } from '../../executor';

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
  lastId?: string;
};

export class CommitmentExecutorV2 extends MystikoExecutor implements CommitmentExecutor {
  public import(options: CommitmentImport): Promise<Commitment[]> {
    return this.context.wallets.checkPassword(options.walletPassword).then(() => this.importAll({ options }));
  }

  public scan(options: CommitmentScan): Promise<Commitment[]> {
    const { shieldedAddress, walletPassword } = options;
    return this.context.wallets.checkPassword(walletPassword).then(() =>
      this.context.accounts.findOne(shieldedAddress).then((account) => {
        if (account) {
          this.logger.info(`start scanning commitments belong to account=${account.shieldedAddress}`);
          return this.context.accounts
            .update(walletPassword, account.id, { status: AccountStatus.SCANNING })
            .then(() => this.scanAccount({ options, account }))
            .then((commitments) => {
              this.logger.info(
                `scanned ${commitments.length} commitments belong to account=${account.shieldedAddress}`,
              );
              return this.context.accounts
                .update(walletPassword, account.id, { status: AccountStatus.SCANNED })
                .then(() => commitments);
            });
        }
        return Promise.resolve([]);
      }),
    );
  }

  public decrypt(options: CommitmentDecrypt): Promise<Commitment> {
    const { commitment, accounts, walletPassword } = options;
    const { encryptedNote } = commitment;
    const accountsPromise: Promise<Account[]> = accounts
      ? Promise.resolve(accounts)
      : this.context.accounts.find();
    if (encryptedNote) {
      return accountsPromise.then((myAccounts) => {
        const commitmentPromises: Promise<Commitment | undefined>[] = myAccounts.map((account) =>
          (this.protocol as MystikoProtocolV2)
            .commitment({
              publicKeys: account.shieldedAddress,
              encryptedNote: {
                encryptedNote: toBuff(encryptedNote),
                skEnc: account.secretKeyForEncryption(this.protocol, walletPassword),
              },
            })
            .then((decryptedCommitment) => {
              const { amount, randomP, commitmentHash } = decryptedCommitment;
              if (commitmentHash.toString() === commitment.commitmentHash) {
                return commitment.atomicUpdate((data) => {
                  const rawSk = account.secretKeyForVerification(this.protocol, walletPassword);
                  const sk = this.protocol.secretKeyForVerification(rawSk);
                  data.serialNumber = (this.protocol as MystikoProtocolV2)
                    .serialNumber(sk, randomP)
                    .toString();
                  data.amount = amount.toString();
                  data.shieldedAddress = account.shieldedAddress;
                  data.updatedAt = MystikoHandler.now();
                  return data;
                });
              }
              /* istanbul ignore next */
              return undefined;
            })
            .catch(() => undefined),
        );
        return Promise.all(commitmentPromises).then((commitments) => {
          for (let i = 0; i < commitments.length; i += 1) {
            const updatedCommitment = commitments[i];
            if (updatedCommitment) {
              return updatedCommitment;
            }
          }
          return commitment;
        });
      });
    }
    /* istanbul ignore next */
    return Promise.resolve(commitment);
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
              return provider
                .getBlockNumber()
                .then((currentBlock) =>
                  this.importChain({ ...importContext, chainConfig, provider, currentBlock }),
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
    const promises: Promise<Commitment[]>[] = [];
    const { chainConfig, currentBlock } = importContext;
    const { chainId, contractAddress } = importContext.options;
    const { poolContracts, depositContracts } = chainConfig;
    const contracts: Array<PoolContractConfig | DepositContractConfig> = [
      ...poolContracts,
      ...depositContracts,
    ];
    this.logger.debug(`importing commitment related events from chain id=${chainConfig.chainId}`);
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
              return [];
            }),
        );
      }
    }
    return Promise.all(promises)
      .then((commitments) => commitments.flat())
      .then((commitments) =>
        this.context.chains.findOne(chainConfig.chainId).then((chain) => {
          if (chain) {
            return chain
              .atomicUpdate((data) => {
                data.syncedBlockNumber = currentBlock;
                data.updatedAt = MystikoHandler.now();
                return data;
              })
              .then(() => commitments);
          }
          /* istanbul ignore next */
          return commitments;
        }),
      );
  }

  private importContract(importContext: ImportContractContext): Promise<Commitment[]> {
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
    return this.importContractEvents({ ...importContext, fromBlock, toBlock });
  }

  private importContractEvents(importContext: ImportEventsContext): Promise<Commitment[]> {
    const { contract, fromBlock, toBlock, currentBlock } = importContext;
    if (fromBlock <= toBlock) {
      return this.importCommitmentQueuedEvents(importContext)
        .then((queuedCommitments) =>
          this.importCommitmentIncludedEvents(importContext).then((includedCommitments) =>
            this.importCommitmentSpentEvents(importContext).then((spentCommitments) => {
              const commitments = new Map<string, Commitment>();
              queuedCommitments.forEach((commitment) =>
                commitments.set(commitment.commitmentHash, commitment),
              );
              includedCommitments.forEach((commitment) =>
                commitments.set(commitment.commitmentHash, commitment),
              );
              spentCommitments.forEach((commitment) =>
                commitments.set(commitment.commitmentHash, commitment),
              );
              return Array.from(commitments.values());
            }),
          ),
        )
        .then((commitments) =>
          contract
            .atomicUpdate((data) => {
              data.syncedBlockNumber = toBlock;
              data.updatedAt = MystikoHandler.now();
              return data;
            })
            .then(() => commitments),
        )
        .then((commitments) => {
          const newFromBlock = toBlock + 1;
          const newToBlock =
            toBlock + contract.syncSize > currentBlock ? currentBlock : toBlock + contract.syncSize;
          const newImportContext = { ...importContext, fromBlock: newFromBlock, toBlock: newToBlock };
          return this.importContractEvents(newImportContext).then((moreCommitments) => [
            ...commitments,
            ...moreCommitments,
          ]);
        });
    }
    return Promise.resolve([]);
  }

  private importCommitmentQueuedEvents(importContext: ImportEventsContext): Promise<Commitment[]> {
    const { chainConfig, contractConfig, options } = importContext;
    if (contractConfig instanceof DepositContractConfig) {
      return Promise.resolve([]);
    }
    const etherContract = this.connectPoolContract(importContext);
    return this.importCommitmentEvents(
      importContext,
      etherContract,
      'CommitmentQueued',
      etherContract.filters.CommitmentQueued(),
    ).then((rawEvents) => {
      const promises: Promise<Commitment[]>[] = rawEvents.map((rawEvent) =>
        this.context.executors.getEventExecutor().import(
          {
            eventType: EventType.COMMITMENT_QUEUED,
            chainId: chainConfig.chainId,
            contractAddress: contractConfig.address,
            commitmentHash: rawEvent.args.commitment,
            leafIndex: rawEvent.args.leafIndex,
            rollupFee: rawEvent.args.rollupFee,
            encryptedNote: rawEvent.args.encryptedNote,
            transactionHash: rawEvent.transactionHash,
          },
          { walletPassword: options.walletPassword, skipCheckPassword: true },
        ),
      );
      return Promise.all(promises).then((commitments) => commitments.flat());
    });
  }

  private importCommitmentIncludedEvents(importContext: ImportEventsContext): Promise<Commitment[]> {
    const { chainConfig, contractConfig, options } = importContext;
    if (contractConfig instanceof DepositContractConfig) {
      return Promise.resolve([]);
    }
    const etherContract = this.connectPoolContract(importContext);
    return this.importCommitmentEvents(
      importContext,
      etherContract,
      'CommitmentIncluded',
      etherContract.filters.CommitmentIncluded(),
    ).then((rawEvents) => {
      const promises: Promise<Commitment[]>[] = rawEvents.map((rawEvent) =>
        this.context.executors.getEventExecutor().import(
          {
            eventType: EventType.COMMITMENT_INCLUDED,
            chainId: chainConfig.chainId,
            contractAddress: contractConfig.address,
            commitmentHash: rawEvent.args.commitment,
            transactionHash: rawEvent.transactionHash,
          },
          { walletPassword: options.walletPassword, skipCheckPassword: true },
        ),
      );
      return Promise.all(promises).then((commitments) => commitments.flat());
    });
  }

  private importCommitmentSpentEvents(importContext: ImportEventsContext): Promise<Commitment[]> {
    const { chainConfig, contractConfig, options } = importContext;
    if (contractConfig instanceof DepositContractConfig) {
      return Promise.resolve([]);
    }
    const etherContract = this.connectPoolContract(importContext);
    return this.importCommitmentEvents(
      importContext,
      etherContract,
      'CommitmentSpent',
      etherContract.filters.CommitmentSpent(),
    ).then((rawEvents) => {
      const promises: Promise<Commitment[]>[] = rawEvents.map((rawEvent) =>
        this.context.executors.getEventExecutor().import(
          {
            eventType: EventType.COMMITMENT_SPENT,
            chainId: chainConfig.chainId,
            contractAddress: contractConfig.address,
            serialNumber: rawEvent.args.serialNumber,
            transactionHash: rawEvent.transactionHash,
          },
          { walletPassword: options.walletPassword, skipCheckPassword: true },
        ),
      );
      return Promise.all(promises).then((commitments) => commitments.flat());
    });
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

  private connectPoolContract(importContext: ImportContractContext): CommitmentPool {
    const { contractConfig, provider } = importContext;
    return this.context.contractConnector.connect<CommitmentPool>(
      'CommitmentPool',
      contractConfig.address,
      provider,
    );
  }

  private scanAccount(scanContext: ScanContext): Promise<Commitment[]> {
    const { options, account, lastId } = scanContext;
    const { scanSize } = account;
    const query: DatabaseQuery<Commitment> = {
      selector: {
        status: { $in: [CommitmentStatus.QUEUED, CommitmentStatus.INCLUDED] },
        shieldedAddress: { $exists: false },
      },
      sort: [{ id: 'asc' }],
      limit: scanSize,
    };
    if (lastId) {
      query.selector.id = { $gt: lastId };
    }
    return this.context.commitments.find(query).then((commitments) => {
      const promises: Promise<Commitment>[] = [];
      commitments.forEach((commitment) => {
        promises.push(
          this.decrypt({ commitment, walletPassword: options.walletPassword, accounts: [account] }).then(
            (decryptedCommitment) => {
              if (
                decryptedCommitment.shieldedAddress === account.shieldedAddress &&
                decryptedCommitment.serialNumber
              ) {
                return this.context.nullifiers
                  .findOne({
                    chainId: decryptedCommitment.chainId,
                    contractAddress: decryptedCommitment.contractAddress,
                    serialNumber: decryptedCommitment.serialNumber,
                  })
                  .then((nullifier) => {
                    if (nullifier) {
                      return decryptedCommitment.atomicUpdate((data) => {
                        data.status = CommitmentStatus.SPENT;
                        data.spendingTransactionHash = nullifier.transactionHash;
                        return data;
                      });
                    }
                    return decryptedCommitment;
                  });
              }
              return decryptedCommitment;
            },
          ),
        );
      });
      return Promise.all(promises).then((updatedCommitments) => {
        const importedCommitment = updatedCommitments.filter(
          (c) => c.shieldedAddress === account.shieldedAddress,
        );
        if (commitments.length === 0 || commitments.length < scanSize) {
          return importedCommitment;
        }
        const updatedLastId = commitments[commitments.length - 1].id;
        return this.scanAccount({ ...scanContext, lastId: updatedLastId }).then((moreCommitments) => [
          ...importedCommitment,
          ...moreCommitments,
        ]);
      });
    });
  }

  private static formatOptions(options: CommitmentImport): string {
    return JSON.stringify({
      chainId: options.chainId,
      contractAddress: options.contractAddress,
    });
  }
}
