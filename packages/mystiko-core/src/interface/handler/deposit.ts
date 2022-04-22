import { BridgeType } from '@mystikonetwork/config';
import { DatabaseQuery, Deposit, DepositStatus } from '@mystikonetwork/database';

export type DepositQuoteOptions = {
  srcChainId: number;
  dstChainId: number;
  assetSymbol: string;
  bridge: BridgeType;
};

export type DepositQuote = {
  minAmount: number;
  minRollupFeeAmount: number;
  rollupFeeAssetSymbol: string;
  minBridgeFeeAmount: number;
  bridgeFeeAssetSymbol: string;
  minExecutorFeeAmount: number;
  executorFeeAssetSymbol: string;
};

export type DepositOptions = {
  srcChainId: number;
  dstChainId: number;
  assetSymbol: string;
  bridge: BridgeType;
  amount: number;
  shieldedAddress: string;
  rollupFee: number;
  executorFee?: number;
  bridgeFee?: number;
  statusCallback?: (deposit: Deposit, oldStatus: DepositStatus, newStatus: DepositStatus) => void;
};

export type DepositSummary = {
  amount: number;
  rollupFeeAmount: number;
  rollupFeeAssetSymbol: string;
  bridgeFeeAmount: number;
  bridgeFeeAssetSymbol: string;
  executorFeeAmount: number;
  executorFeeAssetSymbol: string;
  totals: { [key: string]: number };
};

export type DepositResponse = {
  deposit: Deposit;
  depositPromise: Promise<Deposit>;
};

export type DepositQuery = {
  id?: string;
  chainId?: number;
  contractAddress?: string;
  commitmentHash?: string;
  transactionHash?: string;
};

export type DepositUpdate = {
  status?: DepositStatus;
  errorMessage?: string;
  transactionHash?: string;
  assetApproveTransactionHash?: string;
  relayTransactionHash?: string;
  rollupTransactionHash?: string;
};

export interface DepositHandler<
  D = DepositOptions,
  QO = DepositQuoteOptions,
  QUO = DepositQuote,
  Q = DepositQuery,
  S = DepositSummary,
  R = DepositResponse,
  U = DepositUpdate,
> {
  count(query?: DatabaseQuery<Deposit>): Promise<number>;
  create(options: D): Promise<R>;
  findOne(query: string | Q): Promise<Deposit | null>;
  find(query?: DatabaseQuery<Deposit>): Promise<Deposit[]>;
  quote(options: QO): Promise<QUO>;
  summary(options: D): Promise<S>;
  update(query: string | Q, data: U): Promise<Deposit>;
}