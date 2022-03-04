import BaseSync from './base';
import TopicSync from './topic/base';

export default class ContractSync implements BaseSync {
  private readonly topicSyncs: TopicSync[];

  constructor(topicSyncs: TopicSync[]) {
    this.topicSyncs = topicSyncs;
  }

  public execute(targetBlockNumber: number): Promise<number> {
    return this.executeTopic(targetBlockNumber, 0);
  }

  private executeTopic(targetBlockNumber: number, index: number): Promise<number> {
    if (index < this.topicSyncs.length) {
      return this.topicSyncs[index]
        .execute(targetBlockNumber)
        .then(() => this.executeTopic(targetBlockNumber, index + 1));
    }
    return Promise.resolve(this.syncedBlock);
  }

  public get syncedBlock(): number {
    const topicBlocks = this.topicSyncs.map((topicSync: TopicSync) => topicSync.syncedBlock);
    return Math.min(...topicBlocks);
  }

  public get isSyncing(): boolean {
    for (let index = 0; index < this.topicSyncs.length; index += 1) {
      if (this.topicSyncs[index].isSyncing) {
        return true;
      }
    }
    return false;
  }
}
