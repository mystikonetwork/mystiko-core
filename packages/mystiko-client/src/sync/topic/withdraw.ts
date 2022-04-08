import { ContractInterface, ethers } from 'ethers';
import { ChainConfig } from '@mystikonetwork/config';
import { TopicSync } from './base';
import { Contract, PrivateNoteStatus, RawEvent, WithdrawStatus } from '../../model';
import { ContractHandler, EventHandler, NoteHandler, WithdrawHandler } from '../../handler';

export default class WithdrawTopicSync extends TopicSync {
  private readonly withdrawHandler: WithdrawHandler;

  private readonly noteHandler: NoteHandler;

  constructor(
    contract: Contract,
    eventHandler: EventHandler,
    contractHandler: ContractHandler,
    withdrawHandler: WithdrawHandler,
    noteHandler: NoteHandler,
    config: ChainConfig,
    contractGenerator?: (
      address: string,
      abi: ContractInterface,
      providerOrSigner: ethers.providers.Provider | ethers.Signer,
    ) => ethers.Contract,
  ) {
    super(contract, 'Withdraw', eventHandler, contractHandler, config, contractGenerator);
    this.withdrawHandler = withdrawHandler;
    this.noteHandler = noteHandler;
  }

  protected handleEvents(events: RawEvent[]): Promise<void> {
    const promises = [];
    for (let i = 0; i < events.length; i += 1) {
      const rawEvent = events[i];
      const rootHash = rawEvent.argumentData.rootHash.toString();
      const serialNumber = rawEvent.argumentData.serialNumber.toString();
      const withdraws1 = this.withdrawHandler.getWithdraws({
        filterFunc: (withdraw) =>
          !!withdraw.merkleRootHash &&
          withdraw.merkleRootHash.toString() === rootHash &&
          !!withdraw.serialNumber &&
          withdraw.serialNumber.toString() === serialNumber &&
          withdraw.chainId === rawEvent.chainId,
      });
      const withdraws2 = this.withdrawHandler.getWithdraws({
        filterFunc: (withdraw) =>
          withdraw.transactionHash === rawEvent.transactionHash && withdraw.chainId === rawEvent.chainId,
      });
      const withdraws = [...withdraws1, ...withdraws2];
      const withdrewNoteIds = withdraws.map((withdraw) => withdraw.privateNoteId);
      const notes = this.noteHandler.getPrivateNotes({
        filterFunc: (note) => withdrewNoteIds.indexOf(note.id) !== -1,
      });
      for (let j = 0; j < withdraws.length; j += 1) {
        const withdraw = withdraws[j];
        if (withdraw.status !== WithdrawStatus.SUCCEEDED) {
          withdraw.status = WithdrawStatus.SUCCEEDED;
          withdraw.transactionHash = rawEvent.transactionHash;
          promises.push(this.withdrawHandler.updateWithdraw(withdraw));
        }
      }
      for (let j = 0; j < notes.length; j += 1) {
        const note = notes[j];
        if (note.status !== PrivateNoteStatus.SPENT) {
          note.status = PrivateNoteStatus.SPENT;
          promises.push(this.noteHandler.updatePrivateNote(note));
        }
      }
    }
    return Promise.all(promises).then(() => {});
  }

  protected parseArguments(args?: ethers.utils.Result): any {
    return {
      recipient: args?.recipient,
      rootHash: args?.rootHash?.toString(),
      serialNumber: args?.serialNumber?.toString(),
    };
  }
}
