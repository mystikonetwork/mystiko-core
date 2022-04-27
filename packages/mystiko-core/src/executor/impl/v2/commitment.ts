import { BridgeType, ChainConfig, DepositContractConfig, PoolContractConfig } from '@mystikonetwork/config';
import {
  CommitmentPool,
  SupportedContractType,
  TypedEvent,
  TypedEventFilter,
} from '@mystikonetwork/contracts-abi';
import {
  Commitment,
  CommitmentStatus,
  CommitmentType,
  Contract,
  DepositStatus,
} from '@mystikonetwork/database';
import { MystikoProtocolV2 } from '@mystikonetwork/protocol';
import { toBuff } from '@mystikonetwork/utils';
import { ethers } from 'ethers';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import { MystikoHandler } from '../../../handler';
import { CommitmentExecutor, CommitmentImport } from '../../../interface';
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

export class CommitmentExecutorV2 extends MystikoExecutor implements CommitmentExecutor {
  public import(options: CommitmentImport): Promise<Commitment[]> {
    return this.context.wallets
      .checkPassword(options.walletPassword)
      .then(() => this.importAll({ options: options || {} }));
  }

  private importAll(importContext: ImportContext): Promise<Commitment[]> {
    const promises: Promise<Commitment[]>[] = [];
    const { chainId } = importContext.options;
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
            return [];
          }),
        );
      }
    }
    return Promise.all(promises)
      .then((commitments) => commitments.flat())
      .then((commitments) => {
        this.logger.info(`import is done, imported ${commitments.length} commitments`);
        return commitments;
      });
  }

  private importChain(importContext: ImportChainContext): Promise<Commitment[]> {
    const promises: Promise<Commitment[]>[] = [];
    const { chainConfig, currentBlock } = importContext;
    const { contractAddress } = importContext.options;
    const { poolContracts, depositContracts } = chainConfig;
    const contracts: Array<PoolContractConfig | DepositContractConfig> = [
      ...poolContracts,
      ...depositContracts,
    ];
    this.logger.debug(`importing commitment related events from chain id=${chainConfig.chainId}`);
    for (let i = 0; i < contracts.length; i += 1) {
      const contractConfig = contracts[i];
      if (!contractAddress || contractAddress === contractConfig.address) {
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
    return this.importCommitmentQueuedEvents(importContext)
      .then((queuedCommitments) =>
        this.importCommitmentIncludedEvents(importContext).then((includedCommitments) =>
          this.importCommitmentSpentEvents(importContext).then((spentCommitments) => {
            const commitments = new Map<string, Commitment>();
            queuedCommitments.forEach((commitment) => commitments.set(commitment.commitmentHash, commitment));
            includedCommitments.forEach((commitment) =>
              commitments.set(commitment.commitmentHash, commitment),
            );
            spentCommitments.forEach((commitment) => commitments.set(commitment.commitmentHash, commitment));
            return Array.from(commitments.values());
          }),
        ),
      )
      .then((commitments) =>
        contract
          .atomicUpdate((data) => {
            data.syncedBlockNumber = currentBlock;
            data.updatedAt = MystikoHandler.now();
            return data;
          })
          .then(() => commitments),
      );
  }

  private importCommitmentQueuedEvents(importContext: ImportContractContext): Promise<Commitment[]> {
    const { contractConfig } = importContext;
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
      const promises: Promise<Commitment>[] = rawEvents.map((rawEvent) =>
        this.handleCommitmentQueuedEvent(
          rawEvent.args.commitment,
          rawEvent.args.leafIndex,
          rawEvent.args.rollupFee,
          rawEvent.args.encryptedNote,
          rawEvent.transactionHash,
          importContext,
        ),
      );
      return Promise.all(promises);
    });
  }

  private importCommitmentIncludedEvents(importContext: ImportContractContext): Promise<Commitment[]> {
    const { contractConfig } = importContext;
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
      const promises: Promise<Commitment>[] = rawEvents.map((rawEvent) =>
        this.handleCommitmentIncludedEvent(rawEvent.args.commitment, rawEvent.transactionHash, importContext),
      );
      return Promise.all(promises);
    });
  }

  private importCommitmentSpentEvents(importContext: ImportContractContext): Promise<Commitment[]> {
    const { contractConfig } = importContext;
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
        this.handleCommitmentSpentEvent(rawEvent.args.serialNumber, rawEvent.transactionHash, importContext),
      );
      return Promise.all(promises).then((commitments) => commitments.flat());
    });
  }

  private handleCommitmentQueuedEvent(
    commitmentHash: ethers.BigNumber,
    leafIndex: ethers.BigNumber,
    rollupFee: ethers.BigNumber,
    encryptedNote: string,
    transactionHash: string,
    importContext: ImportContractContext,
  ): Promise<Commitment> {
    const { chainConfig, contractConfig, options } = importContext;
    return this.context.commitments
      .findOne({
        chainId: chainConfig.chainId,
        contractAddress: contractConfig.address,
        commitmentHash: commitmentHash.toString(),
      })
      .then((existingCommitment) => {
        const now = MystikoHandler.now();
        if (existingCommitment) {
          return existingCommitment.atomicUpdate((data) => {
            if (data.status === CommitmentStatus.INIT) {
              data.status = CommitmentStatus.QUEUED;
            }
            data.leafIndex = leafIndex.toString();
            data.rollupFeeAmount = rollupFee.toString();
            data.encryptedNote = encryptedNote;
            data.updatedAt = now;
            if (chainConfig.getPoolContractBridgeType(contractConfig.address) === BridgeType.LOOP) {
              data.creationTransactionHash = transactionHash;
            } else {
              data.relayTransactionHash = transactionHash;
            }
            return data;
          });
        }
        const commitment: CommitmentType = {
          id: MystikoHandler.generateId(),
          createdAt: now,
          updatedAt: now,
          chainId: chainConfig.chainId,
          contractAddress: contractConfig.address,
          assetSymbol: contractConfig.assetSymbol,
          assetDecimals: contractConfig.assetDecimals,
          assetAddress: contractConfig.assetAddress,
          commitmentHash: commitmentHash.toString(),
          leafIndex: leafIndex.toString(),
          rollupFeeAmount: rollupFee.toString(),
          encryptedNote,
          status: CommitmentStatus.QUEUED,
        };
        if (chainConfig.getPoolContractBridgeType(contractConfig.address) === BridgeType.LOOP) {
          commitment.creationTransactionHash = transactionHash;
        } else {
          commitment.relayTransactionHash = transactionHash;
        }
        return this.db.commitments.insert(commitment);
      })
      .then((commitment) => this.updateDepositStatus(commitment, DepositStatus.QUEUED))
      .then((commitment) => this.tryDecryptCommitment(commitment, options.walletPassword));
  }

  private handleCommitmentIncludedEvent(
    commitmentHash: ethers.BigNumber,
    transactionHash: string,
    importContext: ImportContractContext,
  ): Promise<Commitment> {
    const { chainConfig, contractConfig } = importContext;
    return this.context.commitments
      .findOne({
        chainId: chainConfig.chainId,
        contractAddress: contractConfig.address,
        commitmentHash: commitmentHash.toString(),
      })
      .then((existingCommitment) => {
        const now = MystikoHandler.now();
        if (existingCommitment) {
          return existingCommitment.atomicUpdate((data) => {
            if (data.status === CommitmentStatus.INIT || data.status === CommitmentStatus.QUEUED) {
              data.status = CommitmentStatus.INCLUDED;
            }
            data.updatedAt = now;
            data.rollupTransactionHash = transactionHash;
            return data;
          });
        }
        return createErrorPromise(
          `CommitmentIncluded event contains a commitment=${commitmentHash} which does not exist in database`,
          MystikoErrorCode.CORRUPTED_COMMITMENT_DATA,
        );
      })
      .then((commitment) => this.updateDepositStatus(commitment, DepositStatus.INCLUDED));
  }

  private handleCommitmentSpentEvent(
    serialNumber: ethers.BigNumber,
    transactionHash: string,
    importContext: ImportContractContext,
  ): Promise<Commitment[]> {
    const { chainConfig, contractConfig } = importContext;
    return this.context.commitments
      .find({
        selector: {
          chainId: chainConfig.chainId,
          contractAddress: contractConfig.address,
          serialNumber: serialNumber.toString(),
        },
      })
      .then((commitments) => {
        const promises: Promise<Commitment>[] = commitments.map((commitment) =>
          commitment.atomicUpdate((data) => {
            if (data.status !== CommitmentStatus.FAILED) {
              data.status = CommitmentStatus.SPENT;
            }
            data.spendingTransactionHash = transactionHash;
            return data;
          }),
        );
        return Promise.all(promises);
      });
  }

  private importCommitmentEvents<T extends TypedEvent, C extends SupportedContractType>(
    importContext: ImportContractContext,
    etherContract: C,
    eventName: string,
    filter: TypedEventFilter<T>,
    startBlock?: number,
  ): Promise<T[]> {
    const { contract, chainConfig, currentBlock } = importContext;
    const syncedBlock =
      contract.syncedBlockNumber < contract.syncStart ? contract.syncStart : contract.syncedBlockNumber;
    const from = startBlock || syncedBlock + 1;
    let to = from + contract.syncSize - 1;
    if (to > currentBlock) {
      to = currentBlock;
    }
    if (from <= to) {
      this.logger.debug(
        `importing ${eventName} event from ` +
          `chain id=${chainConfig.chainId} contract address=${contract.contractAddress}` +
          ` fromBlock=${from}, toBlock=${to}`,
      );
      return etherContract.queryFilter(filter, from, to).then((rawEvents) => {
        if (rawEvents.length > 0) {
          this.logger.info(
            `fetched ${rawEvents.length} ${eventName} event(s) from contract ` +
              `chain id=${chainConfig.chainId} contract address=${contract.contractAddress}`,
          );
        }
        return this.importCommitmentEvents(importContext, etherContract, eventName, filter, to + 1).then(
          (moreRawEvents) => [...rawEvents, ...moreRawEvents],
        );
      });
    }
    return Promise.resolve([]);
  }

  private tryDecryptCommitment(commitment: Commitment, walletPassword: string): Promise<Commitment> {
    const { encryptedNote } = commitment;
    if (encryptedNote) {
      return this.context.accounts.find().then((accounts) => {
        const commitmentPromises: Promise<Commitment | undefined>[] = accounts.map((account) =>
          (this.protocol as MystikoProtocolV2)
            .commitmentFromEncryptedNote(
              account.publicKeyForVerification(this.protocol),
              account.publicKeyForEncryption(this.protocol),
              account.secretKeyForEncryption(this.protocol, walletPassword),
              toBuff(encryptedNote),
            )
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
    return Promise.resolve(commitment);
  }

  private updateDepositStatus(commitment: Commitment, depositStatus: DepositStatus): Promise<Commitment> {
    return this.context.deposits
      .findOne({
        chainId: commitment.chainId,
        contractAddress: commitment.contractAddress,
        commitmentHash: commitment.commitmentHash,
      })
      .then((deposit) => {
        if (deposit) {
          return this.context.deposits.update(deposit.id, { status: depositStatus }).then(() => commitment);
        }
        return commitment;
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
}
