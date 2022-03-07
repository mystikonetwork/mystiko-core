import { ethers } from 'ethers';
import { toBN, toHexNoPrefix } from '@mystiko/utils';
import { TopicSync } from './base';
import { Contract, DepositStatus, RawEvent } from '../../model';
import { ContractHandler, NoteHandler, DepositHandler, EventHandler } from '../../handler';

export default class MerkleTreeInsertTopicSync extends TopicSync {
  private readonly depositHandler: DepositHandler;

  private readonly noteHandler: NoteHandler;

  constructor(
    contract: Contract,
    etherContract: ethers.Contract,
    topic: string,
    eventHandler: EventHandler,
    contractHandler: ContractHandler,
    depositHandler: DepositHandler,
    noteHandler: NoteHandler,
    syncSize: number,
  ) {
    super(contract, etherContract, topic, eventHandler, contractHandler, syncSize);
    this.depositHandler = depositHandler;
    this.noteHandler = noteHandler;
  }

  protected handleEvents(events: RawEvent[]): Promise<void> {
    const promises = [];
    for (let i = 0; i < events.length; i += 1) {
      const rawEvent = events[i];
      const commitmentHash = toBN(toHexNoPrefix(rawEvent.argumentData.leaf), 16).toString();
      const deposits = this.depositHandler.getDeposits({
        filterFunc: (deposit) =>
          deposit.dstChainId === rawEvent.chainId &&
          !!deposit.commitmentHash &&
          deposit.commitmentHash.toString() === commitmentHash,
      });
      const notes = this.noteHandler.getPrivateNotes({
        filterFunc: (note) =>
          note.dstChainId === rawEvent.chainId &&
          !!note.commitmentHash &&
          note.commitmentHash.toString() === commitmentHash,
      });
      for (let j = 0; j < deposits.length; j += 1) {
        const deposit = deposits[j];
        if (deposit.status !== DepositStatus.SUCCEEDED) {
          deposit.status = DepositStatus.SUCCEEDED;
          deposit.dstTxHash = rawEvent.transactionHash;
          promises.push(this.depositHandler.updateDeposit(deposit));
        }
      }
      for (let j = 0; j < notes.length; j += 1) {
        const note = notes[j];
        note.dstTransactionHash = rawEvent.transactionHash;
        promises.push(this.noteHandler.updatePrivateNote(note));
      }
    }
    return Promise.all(promises).then(() => {});
  }
}
