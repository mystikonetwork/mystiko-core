import { Commitment, DatabaseQuery } from '@mystikonetwork/database';
import { MystikoContext } from '../../context';
import { MystikoHandler } from '../../handler';
import { CommitmentHandler, CommitmentQuery } from '../../interface';

export class CommitmentHandlerV2 extends MystikoHandler implements CommitmentHandler {
  constructor(context: MystikoContext) {
    super(context);
    this.context.commitments = this;
  }

  public count(query?: DatabaseQuery<Commitment>): Promise<number> {
    return Promise.reject(new Error('not implemented'));
  }

  public find(query?: DatabaseQuery<Commitment>): Promise<Commitment[]> {
    return Promise.reject(new Error('not implemented'));
  }

  public findOne(query: CommitmentQuery): Promise<Commitment | undefined> {
    return Promise.reject(new Error('not implemented'));
  }

  public upsert(commitments: Commitment[]): Promise<Commitment[]> {
    return Promise.reject(new Error('not implemented'));
  }
}
