import { DatabaseQuery, Transaction, TransactionEnum, TransactionStatus } from '@mystikonetwork/database';
import { BridgeType } from '@mystikonetwork/config';
import { MystikoSigner } from '@mystikonetwork/ethers';
import { Overrides } from 'ethers';

export type TransactionQuoteOptions = {
  type: TransactionEnum;
  chainId: number;
  assetSymbol: string;
  bridgeType: BridgeType;
  version?: number;
  amount?: number;
  publicAmount?: number;
  useGasRelayers?: boolean;
};

export type GasRelayerInfo = {
  url: string;
  name: string;
  address: string;
  serviceFeeOfTenThousandth: number;
  serviceFeeRatio: number;
  minGasFee: string;
  minGasFeeNumber: number;
};

export type TransactionOptions = TransactionQuoteOptions & {
  walletPassword: string;
  shieldedAddress?: string;
  publicAddress?: string;
  signer: MystikoSigner;
  rollupFee?: number;
  gasRelayerInfo?: GasRelayerInfo;
  gasRelayerWaitingTimeoutMs?: number;
  statusCallback?: (tx: Transaction, oldTxStatus: TransactionStatus, newTxStatus: TransactionStatus) => void;
  transactOverrides?: Overrides & { from?: string | Promise<string> };
  numOfConfirmations?: number;
  waitTimeoutMs?: number;
  providerTimeoutMs?: number;
  rawMerkleTree?: Buffer;
  rawZkProgram?: Buffer;
  rawZkProvingKey?: Buffer;
  rawZkVerifyingKey?: Buffer;
  rawZkAbi?: Buffer;
};

export type TransactionQuote = {
  valid: boolean;
  invalidReason?: string;
  balance: number;
  numOfInputs: number;
  numOfSplits: number;
  minRollupFee: number;
  rollupFeeAssetSymbol: string;
  minAmount: number;
  maxAmount: number;
  fixedAmount: boolean;
  maxGasRelayerFee: number;
  gasRelayerFeeAssetSymbol: string;
};

export type TransactionQuoteWithRelayers = TransactionQuote & {
  gasRelayers: GasRelayerInfo[];
};

export type TransactionSummary = {
  previousBalance: number;
  newBalance: number;
  assetSymbol: string;
  withdrawingAmount: number;
  transferringAmount: number;
  recipient: string;
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
  contractAddress?: string;
  serialNumber?: string;
  inputCommitmentId?: string;
  outputCommitmentId?: string;
  transactionHash?: string;
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
  QUO = TransactionQuoteWithRelayers,
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
  fixStatus(query: string | Q): Promise<Transaction | null>;
}
