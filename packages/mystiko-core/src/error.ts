export enum MystikoErrorCode {
  UNKNOWN_ERROR = 0,
  NO_HANDLER = 1,
  NON_EXISTING_WALLET = 2,
  INVALID_PASSWORD = 3,
  INVALID_MASTER_SEED = 4,
  WRONG_PASSWORD = 5,
  DUPLICATE_ACCOUNT = 6,
  NON_EXISTING_ACCOUNT = 7,
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
