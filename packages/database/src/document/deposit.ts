import { RxDocument } from 'rxdb';
import { fromDecimals } from '@mystikonetwork/utils';
import { DepositType } from '../schema';

export type DepositMethods = {
  simpleAmount: () => number;
  rollupFeeSimpleAmount: () => number;
  bridgeFeeSimpleAmount: () => number;
  executorFeeSimpleAmount: () => number;
};

export type Deposit = RxDocument<DepositType, DepositMethods>;

export const depositMethods: DepositMethods = {
  simpleAmount(this: Deposit): number {
    return fromDecimals(this.amount, this.assetDecimals);
  },
  rollupFeeSimpleAmount(this: Deposit): number {
    return fromDecimals(this.rollupFeeAmount, this.assetDecimals);
  },
  bridgeFeeSimpleAmount(this: Deposit): number {
    return fromDecimals(this.bridgeFeeAmount, this.assetDecimals);
  },
  executorFeeSimpleAmount(this: Deposit): number {
    return fromDecimals(this.executorFeeAmount, this.assetDecimals);
  },
};
