import { DatabaseQuery, Nullifier, NullifierType } from '@mystikonetwork/database';
import { MystikoContextInterface, NullifierHandler, NullifierQuery } from '../../../interface';
import { MystikoHandler } from '../../handler';

export class NullifierHandlerV2 extends MystikoHandler implements NullifierHandler {
  constructor(context: MystikoContextInterface) {
    super(context);
    context.nullifiers = this;
  }

  public find(query?: DatabaseQuery<Nullifier>): Promise<Nullifier[]> {
    return this.db.nullifiers.find(query).exec();
  }

  public findOne(query: string | NullifierQuery): Promise<Nullifier | null> {
    if (typeof query === 'string') {
      return this.db.nullifiers.findOne(query).exec();
    }
    return this.db.nullifiers
      .findOne({
        selector: {
          chainId: query.chainId,
          contractAddress: query.contractAddress,
          serialNumber: query.serialNumber,
        },
      })
      .exec();
  }

  public upsert(data: NullifierType): Promise<Nullifier> {
    return this.findOne(data).then((existing) => {
      if (existing) {
        return existing.atomicUpdate((existingData) => {
          existingData.transactionHash = data.transactionHash;
          existingData.updatedAt = data.updatedAt;
          return existingData;
        });
      }
      return this.db.nullifiers.insert(data);
    });
  }
}
