import BaseSync from './base';
import ContractSync from './contract';

export default class ChainSync implements BaseSync {
  private readonly contractSyncs: ContractSync[];

  constructor(contractSyncs: ContractSync[]) {
    this.contractSyncs = contractSyncs;
  }

  public execute(targetBlockNumber: number): Promise<number> {
    return this.executeContract(targetBlockNumber, 0);
  }

  public get syncedBlock(): number {
    const contractBlocks = this.contractSyncs.map((contractSync: ContractSync) => contractSync.syncedBlock);
    return Math.min(...contractBlocks);
  }

  public get isSyncing(): boolean {
    for (let index = 0; index < this.contractSyncs.length; index += 1) {
      if (this.contractSyncs[index].isSyncing) {
        return true;
      }
    }
    return false;
  }

  private executeContract(targetBlockNumber: number, index: number): Promise<number> {
    if (index < this.contractSyncs.length) {
      return this.contractSyncs[index]
        .execute(targetBlockNumber)
        .then(() => this.executeContract(targetBlockNumber, index + 1));
    }
    return Promise.resolve(this.syncedBlock);
  }
}
