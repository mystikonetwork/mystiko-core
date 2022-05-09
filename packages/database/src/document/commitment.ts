import { RxDocument } from 'rxdb';
import { fromDecimals } from '@mystikonetwork/utils';
import { CommitmentType } from '../schema';

export type CommitmentMethods = {
  simpleAmount: () => number | undefined;
  rollupFeeSimpleAmount: () => number | undefined;
};

export type Commitment = RxDocument<CommitmentType, CommitmentMethods>;
export const commitmentMethods: CommitmentMethods = {
  simpleAmount(this: Commitment): number | undefined {
    if (this.amount) {
      return fromDecimals(this.amount, this.assetDecimals);
    }
    return undefined;
  },
  rollupFeeSimpleAmount(this: Commitment): number | undefined {
    if (this.rollupFeeAmount) {
      return fromDecimals(this.rollupFeeAmount, this.assetDecimals);
    }
    return undefined;
  },
};
