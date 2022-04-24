export enum MystikoErrorCode {
  UNKNOWN_ERROR = 0,
  NO_CONTEXT = 1,
  NO_HANDLER = 2,
  NO_EXECUTOR = 3,
  NO_PROVIDER_POOL = 4,
  WRONG_PASSWORD = 5,
  DUPLICATE_ACCOUNT = 6,
  NON_EXISTING_WALLET = 7,
  NON_EXISTING_ACCOUNT = 8,
  NON_EXISTING_CHAIN = 9,
  NON_EXISTING_DEPOSIT = 10,
  NON_EXISTING_TRANSACTION = 11,
  NON_EXISTING_PROVIDER = 12,
  NON_EXISTING_CONTRACT = 13,
  INVALID_PASSWORD = 14,
  INVALID_MASTER_SEED = 15,
  INVALID_PROVIDER_URL = 16,
  INVALID_DEPOSIT_OPTIONS = 17,
  INVALID_TRANSACTION_OPTIONS = 18,
  INVALID_ASSET_APPROVE_OPTIONS = 19,
  INSUFFICIENT_BALANCE = 20,
  INSUFFICIENT_POOL_BALANCE = 21,
  DUPLICATE_DEPOSIT_COMMITMENT = 22,
  DUPLICATE_COMMITMENT = 23,
  MISSING_COMMITMENT_DATA = 24,
  CORRUPTED_COMMITMENT_DATA = 25,
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
