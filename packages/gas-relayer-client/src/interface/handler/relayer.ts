import { RegisterInfo, TransactResponse, TransactStatus } from '@mystikonetwork/gas-relayer-config';
import { RelayTransactRequest, WaitingJobRequest } from '../../types';
import { GetJobStatusRequest, GetRegisterRequest } from '../../types/register';

export interface IRelayerHandler {
  registerInfo(request: GetRegisterRequest): Promise<RegisterInfo[]>;

  jobStatus(request: GetJobStatusRequest): Promise<TransactStatus>;

  relayTransact(request: RelayTransactRequest): Promise<TransactResponse>;

  waitUntilConfirmed(request: WaitingJobRequest): Promise<TransactStatus>;
}
