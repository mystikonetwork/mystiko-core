export class RelayerError extends Error {
  public readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

export enum RelayerErrorCode {
  CLIENT_INTERNAL_ERROR = -999,
  GET_PROVIDER_ERROR,
  GET_CHAIN_CONFIG_ERROR,
  PARAM_ERROR,
  TIME_OUT,
  REQUEST_SERVER_ERROR,
}
