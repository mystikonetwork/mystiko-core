import { MystikoContextInterface, SynchronizerFactory } from '../../../interface';
import { SynchronizerV2 } from './synchronizer';

export class SynchronizerFactoryV2 implements SynchronizerFactory<SynchronizerV2> {
  public createSynchronizer(context: MystikoContextInterface): SynchronizerV2 {
    return new SynchronizerV2(context);
  }
}
