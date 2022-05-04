import { MystikoContextInterface } from '../context';
import { Synchronizer } from './interface';

export interface SynchronizerFactory<S extends Synchronizer = Synchronizer> {
  createSynchronizer(context: MystikoContextInterface): S;
}
