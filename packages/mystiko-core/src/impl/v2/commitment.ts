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
    return this.db.commitments.find(query).exec();
  }

  public findByAssetAndBridge(query: CommitmentAssetAndBridgeQuery): Promise<Commitment[]> {
    const selector: any = {
      chainId: query.chainId,
      assetSymbol: query.assetSymbol,
      bridgeType: query.bridgeType,
    };
    return this.findByCommonFilter(selector, query);
  }

  public findByContract(query: CommitmentContractQuery): Promise<Commitment[]> {
    const selector: any = {
      chainId: query.chainId,
      contractAddress: query.contractAddress,
    };
    return this.findByCommonFilter(selector, query);
  }

  public findOne(query: CommitmentQuery): Promise<Commitment | null> {
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

  private findByCommonFilter(
    selector: any,
    query: CommitmentAssetAndBridgeQuery | CommitmentContractQuery,
  ): Promise<Commitment[]> {
    if (query.statuses && query.statuses.length > 0) {
      selector.status = { $in: query.statuses };
    }
    if (query.shieldedAddresses && query.shieldedAddresses.length > 0) {
      selector.shieldedAddress = { $in: query.shieldedAddresses };
    }
    return this.find({ selector });
  }
}
