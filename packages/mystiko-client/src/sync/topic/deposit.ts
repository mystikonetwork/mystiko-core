import { ethers } from 'ethers';
import { BridgeType } from '@mystiko/config';
import { toBN, toHexNoPrefix } from '@mystiko/utils';
import { Contract, DepositStatus, RawEvent } from '../../model';
import { TopicSync } from './base';
import { ContractHandler, DepositHandler, EventHandler } from '../../handler';

export default class DepositTopicSync extends TopicSync {
  private readonly depositHandler: DepositHandler;

  constructor(
    contract: Contract,
    etherContract: ethers.Contract,
    topic: string,
    eventHandler: EventHandler,
    contractHandler: ContractHandler,
    depositHandler: DepositHandler,
    syncSize: number,
  ) {
    super(contract, etherContract, topic, eventHandler, contractHandler, syncSize);
    this.depositHandler = depositHandler;
  }

  protected handleEvents(events: RawEvent[]): Promise<void> {
    const promises = [];
    for (let i = 0; i < events.length; i += 1) {
      const rawEvent = events[i];
      const commitmentHash = toBN(toHexNoPrefix(rawEvent.argumentData.commitmentHash), 16).toString();
      const deposits = this.depositHandler.getDeposits({
        filterFunc: (deposit) =>
          deposit.srcChainId === rawEvent.chainId &&
          !!deposit.commitmentHash &&
          deposit.commitmentHash.toString() === commitmentHash,
      });
      for (let j = 0; j < deposits.length; j += 1) {
        const deposit = deposits[j];
        if (this.contract.bridgeType === BridgeType.LOOP && deposit.status !== DepositStatus.SUCCEEDED) {
          deposit.status = DepositStatus.SUCCEEDED;
          promises.push(this.depositHandler.updateDeposit(deposit));
        } else if (
          this.contract.bridgeType !== BridgeType.LOOP &&
          deposit.status !== DepositStatus.SRC_CONFIRMED &&
          deposit.status !== DepositStatus.SUCCEEDED
        ) {
          deposit.status = DepositStatus.SRC_CONFIRMED;
          promises.push(this.depositHandler.updateDeposit(deposit));
        }
      }
    }
    return Promise.all(promises).then(() => {});
  }
}
