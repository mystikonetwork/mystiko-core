import { BridgeType, CircuitType } from '@mystikonetwork/config';
import { ICommitmentPool } from '@mystikonetwork/contracts-abi';
import { BigNumberish } from 'ethers';
import { JobTypeEnum } from '../common';

export enum TransactStatusEnum {
  QUEUED = 'QUEUED',
  SUBMITTED = 'SUBMITTED',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export type TransactData = {
  id: string;
  type: JobTypeEnum;
  request: RequestQueueData;
  status: TransactStatusEnum;
  response?: ResponseQueueData;
  error?: string;
};

export type TransactRequest = ICommitmentPool.TransactRequestStruct & {
  type: JobTypeEnum;
  bridgeType: BridgeType;
  chainId: number;
  symbol: string;
  mystikoContractAddress: string;
  circuitType: CircuitType;
  signature: string;
};

export type RequestQueueData = TransactRequest & {
  relayerContractAddress: string;
  maxGasPrice: BigNumberish;
};

export type TransactResponse = ResponseQueueData & {
  id: string;
};

export type ResponseQueueData = {
  hash: string;
  chainId: number;
  nonce: number;
  from?: string;
  to?: string;
};

export type TransactStatus = {
  id: string;
  type: JobTypeEnum;
  request: RequestQueueData;
  status: TransactStatusEnum;
  response?: ResponseQueueData;
  error: string;
};
