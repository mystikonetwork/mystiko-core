export enum MystikoErrorCode {
  UNKNOWN_ERROR = 0,
  NON_EXISTING_WALLET = 1,
  INVALID_PASSWORD = 2,
  INVALID_MASTER_SEED = 3,
  WRONG_PASSWORD = 4,
  DUPLICATE_ACCOUNT = 5,
  NON_EXISTING_ACCOUNT = 6,
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
