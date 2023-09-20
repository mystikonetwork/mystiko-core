import { ChainStatus } from './chain';

export type RegisterInfo = ChainStatus & {
  registerUrl: string;
  registerName: string;
  relayerAddress: string;
};
