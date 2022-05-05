import { PoolContractConfig } from '@mystikonetwork/config';
import { DatabaseQuery, Transaction } from '@mystikonetwork/database';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import {
  MystikoContextInterface,
  TransactionHandler,
  TransactionOptions,
  TransactionQuery,
  TransactionQuote,
  TransactionQuoteOptions,
  TransactionResponse,
  TransactionSummary,
  TransactionUpdate,
} from '../../../interface';
import { MystikoHandler } from '../../handler';

export class TransactionHandlerV2 extends MystikoHandler implements TransactionHandler {
  constructor(context: MystikoContextInterface) {
    super(context);
    this.context.transactions = this;
  }

  public count(query?: DatabaseQuery<Transaction>): Promise<number> {
    return this.find(query).then((transactions) => transactions.length);
  }

  public create(options: TransactionOptions): Promise<TransactionResponse> {
    return this.getPoolContractConfig(options).then((poolContractConfig) =>
      this.context.executors.getTransactionExecutor(poolContractConfig).execute(options, poolContractConfig),
    );
  }

  public find(query?: DatabaseQuery<Transaction>): Promise<Transaction[]> {
    return this.context.wallets.checkCurrent().then((wallet) => {
      const selector: any = query?.selector || {};
      selector.wallet = wallet.id;
      const databaseQuery = query ? { ...query, selector } : { selector };
      return this.db.transactions.find(databaseQuery).exec();
    });
  }

  public findOne(query: string | TransactionQuery): Promise<Transaction | null> {
    const selector: any = {};
    if (typeof query === 'string') {
      selector.id = query;
    } else {
      if (query.id) {
        selector.id = query.id;
      }
      if (query.chainId) {
        selector.chainId = query.chainId;
      }
      if (query.contractAddress) {
        selector.contractAddress = query.contractAddress;
      }
      if (query.serialNumber) {
        selector.serialNumbers = { $elemMatch: { $eq: query.serialNumber } };
      }
      if (query.inputCommitmentId) {
        selector.inputCommitments = { $elemMatch: { $eq: query.inputCommitmentId } };
      }
      if (query.outputCommitmentId) {
        selector.outputCommitments = { $elemMatch: { $eq: query.outputCommitmentId } };
      }
      if (query.transactionHash) {
        selector.transactionHash = query.transactionHash;
      }
    }
    return this.db.transactions.findOne({ selector }).exec();
  }

  public quote(options: TransactionQuoteOptions): Promise<TransactionQuote> {
    return this.getPoolContractConfig(options).then((poolContractConfig) =>
      this.context.executors.getTransactionExecutor(poolContractConfig).quote(options, poolContractConfig),
    );
  }

  public summary(options: TransactionOptions): Promise<TransactionSummary> {
    return this.getPoolContractConfig(options).then((poolContractConfig) =>
      this.context.executors.getTransactionExecutor(poolContractConfig).summary(options, poolContractConfig),
    );
  }

  public update(query: string | TransactionQuery, data: TransactionUpdate): Promise<Transaction> {
    return this.findOne(query).then((transaction) => {
      if (!transaction) {
        return createErrorPromise(
          `no transaction found for query=${query}`,
          MystikoErrorCode.NON_EXISTING_TRANSACTION,
        );
      }
      return transaction.atomicUpdate((oldData) => {
        let hasUpdate = false;
        if (data.status && data.status !== oldData.status) {
          oldData.status = data.status;
          hasUpdate = true;
        }
        if (data.errorMessage && data.errorMessage !== oldData.errorMessage) {
          oldData.errorMessage = data.errorMessage;
          hasUpdate = true;
        }
        if (data.transactionHash && data.transactionHash !== oldData.transactionHash) {
          oldData.transactionHash = data.transactionHash;
          hasUpdate = true;
        }
        if (hasUpdate) {
          oldData.updatedAt = MystikoHandler.now();
        }
        return oldData;
      });
    });
  }

  private getPoolContractConfig(
    options: TransactionOptions | TransactionQuoteOptions,
  ): Promise<PoolContractConfig> {
    const poolContractConfig = this.config.getPoolContractConfig(
      options.chainId,
      options.assetSymbol,
      options.bridgeType,
    );
    if (!poolContractConfig) {
      return createErrorPromise(
        'invalid transaction options, no corresponding contract found',
        MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
      );
    }
    return Promise.resolve(poolContractConfig);
  }
}
