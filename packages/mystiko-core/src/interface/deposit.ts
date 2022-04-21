import { BridgeType } from '@mystikonetwork/config';
import { DatabaseQuery, Deposit, DepositStatus } from '@mystikonetwork/database';

export type DepositOptions = {
  srcChainId: number;
  dstChainId: number;
  assetSymbol: string;
  bridge: BridgeType;
  amount: number;
  shieldedAddress: string;
  rollupFee: number;
  executorFee?: number;
  bridgeFee?: number;
  statusCallback?: (deposit: Deposit, oldStatus: DepositStatus, newStatus: DepositStatus) => void;
};

export type DepositQuery = string | Deposit;

export interface DepositHandler<D = DepositOptions> {
  create(options: D): Promise<Deposit>;
  update(deposit: Deposit): Promise<Deposit>;
  findOne(query: DepositQuery): Promise<Deposit | null>;
  find(query?: DatabaseQuery<Deposit>): Promise<Deposit[]>;
  count(query?: DatabaseQuery<Deposit>): Promise<number>;
}
