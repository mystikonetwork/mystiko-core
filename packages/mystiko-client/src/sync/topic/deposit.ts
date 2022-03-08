import { ContractInterface, ethers } from 'ethers';
import { BridgeType } from '@mystiko/config';
import { toBN, toHexNoPrefix } from '@mystiko/utils';
import { Contract, DepositStatus, RawEvent } from '../../model';
import { TopicSync } from './base';
import { ContractHandler, DepositHandler, EventHandler } from '../../handler';

export default class DepositTopicSync extends TopicSync {
  private readonly depositHandler: DepositHandler;

  constructor(
    contract: Contract,
    eventHandler: EventHandler,
    contractHandler: ContractHandler,
    depositHandler: DepositHandler,
    syncSize: number,
    contractGenerator?: (
      address: string,
      abi: ContractInterface,
      providerOrSigner: ethers.providers.Provider | ethers.Signer,
    ) => ethers.Contract,
  ) {
    super(contract, 'Deposit', eventHandler, contractHandler, syncSize, contractGenerator);
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

  protected parseArguments(args?: ethers.utils.Result): any {
    return {
      amount: args?.amount?.toString(),
      commitmentHash: args?.commitmentHash,
      encryptedNote: args?.encryptedNote,
    };
  }
}
