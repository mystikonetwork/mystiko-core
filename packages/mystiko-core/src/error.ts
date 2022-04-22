export enum MystikoErrorCode {
  UNKNOWN_ERROR = 0,
  NO_CONTEXT = 1,
  NO_HANDLER = 2,
  WRONG_PASSWORD = 3,
  DUPLICATE_ACCOUNT = 4,
  NON_EXISTING_WALLET = 5,
  NON_EXISTING_ACCOUNT = 6,
  NON_EXISTING_CHAIN = 7,
  NON_EXISTING_DEPOSIT = 8,
  NON_EXISTING_TRANSACTION = 9,
  INVALID_PASSWORD = 10,
  INVALID_MASTER_SEED = 11,
  INVALID_PROVIDER_URL = 12,
  INVALID_DEPOSIT_OPTIONS = 13,
  INVALID_TRANSACTION_OPTIONS = 14,
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
