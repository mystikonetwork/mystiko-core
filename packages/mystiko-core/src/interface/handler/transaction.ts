import { DatabaseQuery, Transaction, TransactionEnum, TransactionStatus } from '@mystikonetwork/database';
import { BridgeType } from '@mystikonetwork/config';

export type TransactionQuoteOptions = {
  type: TransactionEnum;
  chainId: number;
  assetSymbol: string;
  bridgeType: BridgeType;
  amount?: number;
  publicAmount?: number;
};

export type TransferOptions = TransactionQuoteOptions & {
  amount: number;
  rollupFee?: number;
  gasRelayerFee?: number;
  gasRelayerAddress?: string;
  gasRelayerEndpoint?: string;
  statusCallback?: (tx: Transaction, oldTxStatus: TransactionStatus, newTxStatus: TransactionStatus) => void;
};

export type WithdrawOptions = TransactionQuoteOptions & {
  publicAmount: number;
  publicRecipient: string;
  rollupFee?: number;
  gasRelayerFee?: number;
  gasRelayerAddress?: string;
  gasRelayerEndpoint?: string;
  statusCallback?: (tx: Transaction, oldTxStatus: TransactionStatus, newTxStatus: TransactionStatus) => void;
};

export type TransactionQuote = {
  valid: boolean;
  invalidReason?: string;
  balance: number;
  poolBalance: number;
  numOfSplits: number;
  minRollupFee: number;
  rollupFeeAssetSymbol: string;
  maxAmount: number;
  fixedAmount: boolean;
  maxGasRelayerFee: number;
  gasRelayerFeeAssetSymbol: string;
};

export type TransactionSummary = {
  previousBalance: number;
  newBalance: number;
  spentAmount: number;
  withdrawingAmount: number;
  transferringAmount: number;
  rollupFeeAmount: number;
  rollupFeeAssetSymbol: string;
  gasRelayerFeeAmount: number;
  gasRelayerFeeAssetSymbol: string;
  gasRelayerAddress?: string;
};

export type TransactionResponse = {
  transaction: Transaction;
  transactionPromise: Promise<Transaction>;
};

export type TransactionQuery = {
  id?: string;
  chainId?: number;
  contractAddress?: number;
  transactionHash?: number;
};

export type TransactionUpdate = {
  status?: TransactionStatus;
  errorMessage?: string;
  transactionHash?: string;
};

export interface TransactionHandler<
  T = TransferOptions,
  W = WithdrawOptions,
  Q = TransactionQuery,
  QO = TransactionQuoteOptions,
  QUO = TransactionQuote,
  S = TransactionSummary,
  R = TransactionResponse,
  U = TransactionUpdate,
> {
  create(options: T | W): Promise<R>;
  count(query?: DatabaseQuery<Transaction>): Promise<number>;
  findOne(query: string | Q): Promise<Transaction | null>;
  find(query?: DatabaseQuery<Transaction>): Promise<Transaction[]>;
  quote(options: QO): Promise<QUO>;
  summary(options: T | W): Promise<S>;
  update(query: string | Q, data: U): Promise<Transaction>;
}
