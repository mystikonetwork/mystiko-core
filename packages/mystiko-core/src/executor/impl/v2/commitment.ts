import {
  BridgeType,
  ChainConfig,
  ContractType,
  DepositContractConfig,
  PoolContractConfig,
} from '@mystikonetwork/config';
import { CommitmentPool, MystikoContractFactory } from '@mystikonetwork/contracts-abi';
import { Commitment, CommitmentStatus, CommitmentType, DepositStatus } from '@mystikonetwork/database';
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
};

type ImportContractContext = ImportChainContext & {
  contractConfig: PoolContractConfig | DepositContractConfig;
};

export class CommitmentExecutorV2 extends MystikoExecutor implements CommitmentExecutor {
  public import(options: CommitmentImport): Promise<Commitment[]> {
    return this.context.wallets.checkPassword(options.walletPassword).then(() => {
      if (options && options.chainId) {
        const chainConfig = this.config.getChainConfig(options.chainId);
        const provider = this.context.providers.getProvider(options.chainId);
        if (!chainConfig) {
          return createErrorPromise(
            `no such chain id=${options.chainId} configured`,
            MystikoErrorCode.NON_EXISTING_CHAIN,
          );
        }
        if (!provider) {
          return createErrorPromise(
            `no such provider configured for chain id=${options.chainId}`,
            MystikoErrorCode.NON_EXISTING_PROVIDER,
          );
        }
        if (options.contractAddress) {
          if (options.contractAddress === ContractType.DEPOSIT) {
            const contractConfig = chainConfig.getDepositContractByAddress(options.contractAddress);
            if (!contractConfig) {
              return createErrorPromise(
                `no such deposit contract address=${options.contractAddress} on chain id=${options.chainId}`,
                MystikoErrorCode.NON_EXISTING_CONTRACT,
              );
            }
            return this.importContract({ options, chainConfig, provider, contractConfig });
          }
          const contractConfig = chainConfig.getPoolContractByAddress(options.contractAddress);
          if (!contractConfig) {
            return createErrorPromise(
              `no such pool contract address=${options.contractAddress} on chain id=${options.chainId}`,
              MystikoErrorCode.NON_EXISTING_CONTRACT,
            );
          }
          return this.importContract({ options, chainConfig, provider, contractConfig });
        }
        return this.importChain({ options, chainConfig, provider });
      }
      return this.importAll({ options: options || {} });
    });
  }

  private importAll(importContext: ImportContext): Promise<Commitment[]> {
    const promises: Promise<Commitment[]>[] = [];
    for (let i = 0; i < this.config.chains.length; i += 1) {
      const chainConfig = this.config.chains[i];
      const provider = this.context.providers.getProvider(chainConfig.chainId);
      if (provider) {
        promises.push(this.importChain({ ...importContext, chainConfig, provider }));
      }
    }
    return Promise.all(promises).then((commitments) => commitments.flat());
  }

  private importChain(importContext: ImportChainContext): Promise<Commitment[]> {
    const promises: Promise<Commitment[]>[] = [];
    const { chainConfig } = importContext;
    this.logger.info(`importing commitment related events from chain id=${chainConfig.chainId}`);
    chainConfig.poolContracts.forEach((contractConfig) => {
      promises.push(this.importContract({ ...importContext, contractConfig }));
    });
    chainConfig.depositContractsWithDisabled.forEach((contractConfig) => {
      promises.push(this.importContract({ ...importContext, contractConfig }));
    });
    return Promise.all(promises).then((commitments) => commitments.flat());
  }

  private importContract(importContext: ImportContractContext): Promise<Commitment[]> {
    const { chainConfig, contractConfig } = importContext;
    this.logger.info(
      'importing commitment related events from ' +
        `chain id=${chainConfig.chainId} contract address=${contractConfig.address}`,
    );
    return this.importCommitmentQueuedEvents(importContext).then((queuedCommitments) =>
      this.importCommitmentIncludedEvents(importContext).then((includedCommitments) => {
        const commitments = new Map<string, Commitment>();
        queuedCommitments.forEach((commitment) => commitments.set(commitment.commitmentHash, commitment));
        includedCommitments.forEach((commitment) => commitments.set(commitment.commitmentHash, commitment));
        return Array.from(commitments.values());
      }),
    );
  }

  private importCommitmentQueuedEvents(importContext: ImportContractContext): Promise<Commitment[]> {
    const { options, chainConfig, contractConfig } = importContext;
    if (contractConfig instanceof DepositContractConfig) {
      return Promise.resolve([]);
    }
    this.logger.info(
      'importing CommitmentQueued event from ' +
        `chain id=${chainConfig.chainId} contract address=${contractConfig.address}`,
    );
    const startBlock = options.startBlock || contractConfig.startBlock;
    const { toBlock } = options;
    const contract = CommitmentExecutorV2.connectPoolContract(importContext);
    return contract
      .queryFilter(contract.filters.CommitmentQueued(), startBlock, toBlock)
      .then((rawEvents) => {
        this.logger.info(
          `fetched ${rawEvents.length} CommitmentQueued event(s) from contract ` +
            `chain id=${chainConfig.chainId} contract address=${contractConfig.address}`,
        );
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
    const { options, chainConfig, contractConfig } = importContext;
    if (contractConfig instanceof DepositContractConfig) {
      return Promise.resolve([]);
    }
    this.logger.info(
      'importing CommitmentIncluded event from ' +
        `chain id=${chainConfig.chainId} contract address=${contractConfig.address}`,
    );
    const startBlock = options.startBlock || contractConfig.startBlock;
    const { toBlock } = options;
    const contract = CommitmentExecutorV2.connectPoolContract(importContext);
    return contract
      .queryFilter(contract.filters.CommitmentIncluded(), startBlock, toBlock)
      .then((rawEvents) => {
        this.logger.info(
          `fetched ${rawEvents.length} CommitmentIncluded event(s) from contract ` +
            `chain id=${chainConfig.chainId} contract address=${contractConfig.address}`,
        );
        const promises: Promise<Commitment>[] = rawEvents.map((rawEvent) =>
          this.handleCommitmentIncludedEvent(
            rawEvent.args.commitment,
            rawEvent.transactionHash,
            importContext,
          ),
        );
        return Promise.all(promises);
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
              const { amount } = decryptedCommitment;
              return commitment.atomicUpdate((data) => {
                data.amount = amount.toString();
                data.shieldedAddress = account.shieldedAddress;
                data.updatedAt = MystikoHandler.now();
                return data;
              });
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

  private static connectPoolContract(importContext: ImportContractContext): CommitmentPool {
    const { contractConfig, provider } = importContext;
    return MystikoContractFactory.connect<CommitmentPool>('CommitmentPool', contractConfig.address, provider);
  }
}
