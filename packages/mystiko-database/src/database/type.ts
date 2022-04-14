import { MangoQuery, RxDatabase } from 'rxdb';
import {
  AccountCollection,
  ChainCollection,
  CircuitCollection,
  CommitmentCollection,
  ContractCollection,
  DepositCollection,
  TransactionCollection,
  WalletCollection,
} from '../collection';
import {
  ACCOUNT_COLLECTION_NAME,
  CHAIN_COLLECTION_NAME,
  CIRCUIT_COLLECTION_NAME,
  COMMITMENT_COLLECTION_NAME,
  CONTRACT_COLLECTION_NAME,
  DEPOSIT_COLLECTION_NAME,
  TRANSACTION_COLLECTION_NAME,
  WALLET_COLLECTION_NAME,
} from '../constants';

export type MystikoClientCollections = {
  [ACCOUNT_COLLECTION_NAME]: AccountCollection;
  [CHAIN_COLLECTION_NAME]: ChainCollection;
  [CIRCUIT_COLLECTION_NAME]: CircuitCollection;
  [COMMITMENT_COLLECTION_NAME]: CommitmentCollection;
  [CONTRACT_COLLECTION_NAME]: ContractCollection;
  [DEPOSIT_COLLECTION_NAME]: DepositCollection;
  [TRANSACTION_COLLECTION_NAME]: TransactionCollection;
  [WALLET_COLLECTION_NAME]: WalletCollection;
};

export type MystikoDatabase = RxDatabase<MystikoClientCollections>;

export type DatabaseQuery<T> = MangoQuery<T>;
