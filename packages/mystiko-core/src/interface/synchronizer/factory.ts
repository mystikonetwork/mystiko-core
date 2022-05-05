import { Synchronizer } from './interface';

export interface SynchronizerFactory<S extends Synchronizer = Synchronizer> {
  createSynchronizer(): S;
}
