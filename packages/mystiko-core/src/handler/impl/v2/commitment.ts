import { Commitment, DatabaseQuery } from '@mystikonetwork/database';
import { MystikoHandler } from '../../handler';
import {
  CommitmentHandler,
  CommitmentContractQuery,
  CommitmentQuery,
  MystikoContextInterface,
  CommitmentImport,
} from '../../../interface';

export class CommitmentHandlerV2 extends MystikoHandler implements CommitmentHandler {
  constructor(context: MystikoContextInterface) {
    super(context);
    this.context.commitments = this;
  }

  public find(query?: DatabaseQuery<Commitment>): Promise<Commitment[]> {
    return this.db.commitments.find(query).exec();
  }

  public findByContract(query: CommitmentContractQuery): Promise<Commitment[]> {
    const selector: any = {
      chainId: query.chainId,
      contractAddress: query.contractAddress,
    };
    return this.findByCommonFilter(selector, query);
  }

  public findOne(query: CommitmentQuery | string): Promise<Commitment | null> {
    if (typeof query === 'string') {
      return this.db.commitments.findOne(query).exec();
    }
    return this.db.commitments
      .findOne({
        selector: {
          chainId: query.chainId,
          contractAddress: query.contractAddress,
          commitmentHash: query.commitmentHash,
        },
      })
      .exec();
  }

  private findByCommonFilter(selector: any, query: CommitmentContractQuery): Promise<Commitment[]> {
    if (query.statuses && query.statuses.length > 0) {
      selector.status = { $in: query.statuses };
    }
    if (query.shieldedAddresses && query.shieldedAddresses.length > 0) {
      selector.shieldedAddress = { $in: query.shieldedAddresses };
    }
    return this.find({ selector });
  }

  public import(options: CommitmentImport): Promise<Commitment[]> {
    return this.context.executors.getCommitmentExecutor().import(options);
  }
}
