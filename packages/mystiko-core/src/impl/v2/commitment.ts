import { Commitment, DatabaseQuery } from '@mystikonetwork/database';
import { MystikoContext } from '../../context';
import { MystikoHandler } from '../../handler';
import {
  CommitmentHandler,
  CommitmentContractQuery,
  CommitmentAssetAndBridgeQuery,
  CommitmentQuery,
} from '../../interface';

export class CommitmentHandlerV2 extends MystikoHandler implements CommitmentHandler {
  constructor(context: MystikoContext) {
    super(context);
    this.context.commitments = this;
  }

  public find(query?: DatabaseQuery<Commitment>): Promise<Commitment[]> {
    return Promise.reject(new Error('not implemented'));
  }

  public findByAssetAndBridge(query: CommitmentAssetAndBridgeQuery): Promise<Commitment[]> {
    return Promise.resolve([]);
  }

  public findByContract(query: CommitmentContractQuery): Promise<Commitment[]> {
    return Promise.resolve([]);
  }

  public findOne(query: CommitmentQuery): Promise<Commitment | undefined> {
    return Promise.reject(new Error('not implemented'));
  }
}
