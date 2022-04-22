export enum MystikoErrorCode {
  UNKNOWN_ERROR = 0,
  NO_CONTEXT = 1,
  NO_HANDLER = 2,
  NON_EXISTING_WALLET = 3,
  INVALID_PASSWORD = 4,
  INVALID_MASTER_SEED = 5,
  WRONG_PASSWORD = 6,
  DUPLICATE_ACCOUNT = 7,
  NON_EXISTING_ACCOUNT = 8,
  NON_EXISTING_CHAIN = 9,
  INVALID_PROVIDER_URL = 10,
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
