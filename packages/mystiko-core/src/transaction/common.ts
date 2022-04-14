import { DatabaseQuery, Transaction, TransactionStatus } from '@mystikonetwork/database';

export type TransferOptions = {
  chainId: number;
  assetSymbol: string;
  amount: number;
  rollupFee?: number;
  gasRelayerFee?: number;
  gasRelayerAddress?: string;
  gasRelayerEndpoint?: string;
  statusCallback?: (tx: Transaction, oldTxStatus: TransactionStatus, newTxStatus: TransactionStatus) => void;
};

export type WithdrawOptions = {
  chainId: number;
  assetSymbol: string;
  publicAmount: number;
  publicRecipient: string;
  rollupFee?: number;
  gasRelayerFee?: number;
  gasRelayerAddress?: string;
  gasRelayerEndpoint?: string;
  statusCallback?: (tx: Transaction, oldTxStatus: TransactionStatus, newTxStatus: TransactionStatus) => void;
};

export type TransactionSummary = {};

export type TransactionQuery = string | Transaction;

export interface TransactionHandler<T = TransferOptions, W = WithdrawOptions, S = TransactionSummary> {
  create(options: T | W): Promise<Transaction>;
  update(tx: Transaction): Promise<Transaction>;
  findOne(query: TransactionQuery): Promise<Transaction | null>;
  find(query?: DatabaseQuery<Transaction>): Promise<Transaction[]>;
  count(query?: DatabaseQuery<Transaction>): Promise<number>;
  summary(options: T | W): Promise<S>;
  hasRollupFee(options: T | W): Promise<boolean>;
}
