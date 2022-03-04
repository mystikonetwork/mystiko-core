import ChainSync from './chain';

export default class FullSync {
  private readonly chainSyncs: { [key: number]: ChainSync };

  constructor(chainSyncs: { [key: number]: ChainSync }) {
    this.chainSyncs = chainSyncs;
  }

  public get isSyncing(): boolean {
    const chainSyncs = Object.values(this.chainSyncs);
    for (let index = 0; index < chainSyncs.length; index += 1) {
      if (chainSyncs[index].isSyncing) {
        return true;
      }
    }
    return false;
  }
}
