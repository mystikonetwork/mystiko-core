import { Commitment } from '@mystikonetwork/database';
import { ethers } from 'ethers';

export enum EventType {
  COMMITMENT_QUEUED = 0,
  COMMITMENT_INCLUDED = 1,
  COMMITMENT_SPENT = 2,
}

export type ContractBaseEvent = {
  eventType: EventType;
  chainId: number;
  contractAddress: string;
  transactionHash: string;
};

export type CommitmentQueuedEvent = ContractBaseEvent & {
  eventType: EventType.COMMITMENT_QUEUED;
  commitmentHash: ethers.BigNumber | string;
  leafIndex: ethers.BigNumber | string;
  rollupFee: ethers.BigNumber | string;
  encryptedNote: string;
};

export type CommitmentIncludedEvent = ContractBaseEvent & {
  eventType: EventType.COMMITMENT_INCLUDED;
  commitmentHash: ethers.BigNumber | string;
};

export type CommitmentSpentEvent = ContractBaseEvent & {
  eventType: EventType.COMMITMENT_SPENT;
  serialNumber: ethers.BigNumber | string;
};

export type ContractEvent = CommitmentQueuedEvent | CommitmentIncludedEvent | CommitmentSpentEvent;

export type EventImportOptions = {
  walletPassword: string;
  skipCheckPassword?: boolean;
};

export interface EventExecutor<E = ContractEvent, IO = EventImportOptions> {
  import(event: E, options: IO): Promise<Commitment[]>;
  importBatch(events: E[], options: IO): Promise<Commitment[]>;
}
