import { TransactRequest } from '@mystikonetwork/gas-relayer-config';

export type RelayTransactRequest = {
  relayerUrl: string;
  transactRequest: TransactRequest;
};
