import { CircuitType } from '@mystikonetwork/config';

export type GetRegisterRequest = {
  chainId: number;
  options?: RegisterOptions;
};

export type RegisterOptions = {
  assetSymbol: string;
  assetDecimals: number;
  circuitType: CircuitType;
  showUnavailable?: boolean;
};

export type GetJobStatusRequest = {
  registerUrl: string;
  jobId: string;
  options?: JobStatusOptions;
};

export type JobStatusOptions = {
  chainId: number;
};
