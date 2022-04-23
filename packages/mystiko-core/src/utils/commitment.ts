import { toBN } from '@mystikonetwork/utils';

type CommitmentLike = {
  amount?: string;
};

export class CommitmentUtils {
  public static sum<C extends CommitmentLike>(commitments: C[]): string {
    return commitments.map((c) => c.amount || '0').reduce((c1, c2) => toBN(c1).add(toBN(c2)).toString(), '0');
  }

  public static sort<C extends CommitmentLike>(commitments: C[], desc = true): C[] {
    return commitments.sort((c1, c2) => {
      const amount1 = toBN(c1.amount || 0);
      const amount2 = toBN(c2.amount || 0);
      if (amount2.gt(amount1)) {
        return desc ? 1 : -1;
      }
      if (amount2.lt(amount1)) {
        return desc ? -1 : 1;
      }
      return 0;
    });
  }

  public static inputMax<C extends CommitmentLike>(commitments: C[], numInputs: number): string {
    return this.sum(this.sort(commitments).slice(0, numInputs));
  }

  public static select<C extends CommitmentLike>(commitments: C[], numInputs: number, amount: string): C[] {
    const sortedCommitments = this.sort(commitments, false);
    return this.selectSorted(sortedCommitments, numInputs, amount);
  }

  private static selectSorted<C extends CommitmentLike>(
    commitments: C[],
    numInputs: number,
    amount: string,
  ): C[] {
    if (numInputs <= 0) {
      return [];
    }
    for (let i = 0; i < commitments.length; i += 1) {
      const commitment = commitments[i];
      if (toBN(commitment.amount || 0).gte(toBN(amount))) {
        return [commitment];
      }
    }
    for (let i = 0; i < commitments.length; i += 1) {
      const commitment = commitments[i];
      const remainingAmount = toBN(amount)
        .sub(toBN(commitment.amount || 0))
        .toString();
      const remainingCommitments = this.selectSorted(
        commitments.slice(i + 1),
        numInputs - 1,
        remainingAmount,
      );
      if (remainingCommitments.length > 0) {
        return [commitment, ...remainingCommitments];
      }
    }
    return [];
  }
}
