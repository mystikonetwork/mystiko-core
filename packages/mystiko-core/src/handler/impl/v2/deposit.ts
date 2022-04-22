import { DepositContractConfig } from '@mystikonetwork/config';
import { DatabaseQuery, Deposit } from '@mystikonetwork/database';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import {
  DepositHandler,
  DepositOptions,
  DepositQuery,
  DepositQuote,
  DepositQuoteOptions,
  DepositResponse,
  DepositSummary,
  DepositUpdate,
  MystikoContextInterface,
} from '../../../interface';
import { MystikoHandler } from '../../handler';

export class DepositHandlerV2 extends MystikoHandler implements DepositHandler {
  constructor(context: MystikoContextInterface) {
    super(context);
    this.context.deposits = this;
  }

  public count(query?: DatabaseQuery<Deposit>): Promise<number> {
    return this.find(query).then((deposits) => deposits.length);
  }

  public create(options: DepositOptions): Promise<DepositResponse> {
    return this.getDepositContractConfig(options).then((depositContractConfig) =>
      this.context.executors
        .getDepositExecutor(depositContractConfig)
        .execute(options, depositContractConfig),
    );
  }

  public find(query?: DatabaseQuery<Deposit>): Promise<Deposit[]> {
    return this.context.wallets.checkCurrent().then((wallet) => {
      const selector: any = query?.selector || {};
      selector.wallet = wallet.id;
      const databaseQuery = query ? { ...query, selector } : { selector };
      return this.db.deposits.find(databaseQuery).exec();
    });
  }

  public findOne(query: string | DepositQuery): Promise<Deposit | null> {
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
      if (query.commitmentHash) {
        selector.commitmentHash = query.commitmentHash;
      }
      if (query.transactionHash) {
        selector.transactionHash = query.transactionHash;
      }
    }
    return this.db.deposits.findOne({ selector }).exec();
  }

  public quote(options: DepositQuoteOptions): Promise<DepositQuote> {
    return this.getDepositContractConfig(options).then((depositContractConfig) =>
      this.context.executors.getDepositExecutor(depositContractConfig).quote(options, depositContractConfig),
    );
  }

  public update(query: string | DepositQuery, data: DepositUpdate): Promise<Deposit> {
    return this.findOne(query).then((deposit) => {
      if (!deposit) {
        return createErrorPromise(
          `no deposit found for query ${query}`,
          MystikoErrorCode.NON_EXISTING_DEPOSIT,
        );
      }
      return deposit.atomicUpdate((oldData) => {
        let hasUpdate = false;
        if (data.status) {
          oldData.status = data.status;
          hasUpdate = true;
        }
        if (data.errorMessage) {
          oldData.errorMessage = data.errorMessage;
          hasUpdate = true;
        }
        if (data.transactionHash) {
          oldData.transactionHash = data.transactionHash;
          hasUpdate = true;
        }
        if (data.assetApproveTransactionHash) {
          oldData.assetApproveTransactionHash = data.assetApproveTransactionHash;
          hasUpdate = true;
        }
        if (data.relayTransactionHash) {
          oldData.relayTransactionHash = data.relayTransactionHash;
          hasUpdate = true;
        }
        if (data.rollupTransactionHash) {
          oldData.rollupTransactionHash = data.rollupTransactionHash;
          hasUpdate = true;
        }
        if (hasUpdate) {
          oldData.updatedAt = MystikoHandler.now();
        }
        return oldData;
      });
    });
  }

  public summary(options: DepositOptions): Promise<DepositSummary> {
    return this.getDepositContractConfig(options).then((depositContractConfig) =>
      this.context.executors
        .getDepositExecutor(depositContractConfig)
        .summary(options, depositContractConfig),
    );
  }

  private getDepositContractConfig(
    options: DepositOptions | DepositQuoteOptions,
  ): Promise<DepositContractConfig> {
    const contractConfig = this.config.getDepositContractConfig(
      options.srcChainId,
      options.dstChainId,
      options.assetSymbol,
      options.bridge,
    );
    if (!contractConfig) {
      return createErrorPromise(
        `invalid deposit options ${options}, no corresponding contract found`,
        MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
      );
    }
    return Promise.resolve(contractConfig);
  }
}
