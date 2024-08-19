export enum MystikoErrorCode {
  UNKNOWN_ERROR = 0,
  NO_CONTEXT = 1,
  NO_HANDLER = 2,
  NO_EXECUTOR = 3,
  NO_PROVIDER_POOL = 4,
  NO_CONTRACT_CONNECTOR = 5,
  WRONG_PASSWORD = 6,
  DUPLICATE_ACCOUNT = 7,
  NON_EXISTING_WALLET = 8,
  NON_EXISTING_ACCOUNT = 9,
  NON_EXISTING_CHAIN = 10,
  NON_EXISTING_DEPOSIT = 11,
  NON_EXISTING_TRANSACTION = 12,
  NON_EXISTING_PROVIDER = 13,
  NON_EXISTING_CONTRACT = 14,
  NON_EXISTING_CIRCUIT_CONFIG = 15,
  INVALID_PASSWORD = 16,
  INVALID_MASTER_SEED = 17,
  INVALID_PROVIDER_URL = 18,
  INVALID_DEPOSIT_OPTIONS = 19,
  INVALID_TRANSACTION_OPTIONS = 20,
  INVALID_ASSET_APPROVE_OPTIONS = 21,
  INVALID_ZKP_PROOF = 22,
  INVALID_TRANSACTION_REQUEST = 23,
  INSUFFICIENT_BALANCE = 24,
  INSUFFICIENT_POOL_BALANCE = 25,
  DUPLICATE_DEPOSIT_COMMITMENT = 26,
  DUPLICATE_COMMITMENT = 27,
  MISSING_COMMITMENT_DATA = 28,
  CORRUPTED_COMMITMENT_DATA = 29,
  SYNCHRONIZER_CLOSED = 30,
  WRONG_AUDITOR_NUMBER = 31,
  NO_GAS_RELAYER_CLIENT = 32,
  INVALID_AUTO_SYNC_INTERVAL = 33,
  NO_MERKLE_TREE_FOUND = 34,
  NO_SCREENING_CLIENT = 35,
}

export class MystikoError extends Error {
  public readonly code: MystikoErrorCode;

  constructor(message: string, code: MystikoErrorCode) {
    super(message);
    this.code = code;
  }
}

export function createError(message: string, code?: MystikoErrorCode): MystikoError {
  return new MystikoError(message, code || MystikoErrorCode.UNKNOWN_ERROR);
}

export function createErrorPromise(message: string, code?: MystikoErrorCode): Promise<any> {
  return Promise.reject(createError(message, code));
}
