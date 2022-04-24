import { DatabaseQuery, Transaction, TransactionEnum, TransactionStatus } from '@mystikonetwork/database';
import { BridgeType } from '@mystikonetwork/config';
import { MystikoSigner } from '@mystikonetwork/ethers';

export type TransactionQuoteOptions = {
  type: TransactionEnum;
  chainId: number;
  assetSymbol: string;
  bridgeType: BridgeType;
  amount?: number;
  publicAmount?: number;
};

export type TransactionOptions = TransactionQuoteOptions & {
  walletPassword: string;
  shieldedAddress?: string;
  publicAddress?: string;
  signer: MystikoSigner;
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
  numOfSplits: number;
  minRollupFee: number;
  rollupFeeAssetSymbol: string;
  minAmount: number;
  maxAmount: number;
  fixedAmount: boolean;
  maxGasRelayerFee: number;
  gasRelayerFeeAssetSymbol: string;
};

export type TransactionSummary = {
  previousBalance: number;
  newBalance: number;
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
  T = TransactionOptions,
  Q = TransactionQuery,
  QO = TransactionQuoteOptions,
  QUO = TransactionQuote,
  S = TransactionSummary,
  R = TransactionResponse,
  U = TransactionUpdate,
> {
  create(options: T): Promise<R>;
  count(query?: DatabaseQuery<Transaction>): Promise<number>;
  findOne(query: string | Q): Promise<Transaction | null>;
  find(query?: DatabaseQuery<Transaction>): Promise<Transaction[]>;
  quote(options: QO): Promise<QUO>;
  summary(options: T): Promise<S>;
  update(query: string | Q, data: U): Promise<Transaction>;
}
