import { MystikoContextInterface, SynchronizerFactory } from '../../../interface';
import { SynchronizerV2 } from './synchronizer';

export class SynchronizerFactoryV2 implements SynchronizerFactory<SynchronizerV2> {
  private readonly context: MystikoContextInterface;

  constructor(context: MystikoContextInterface) {
    this.context = context;
  }

  public createSynchronizer(): SynchronizerV2 {
    return new SynchronizerV2(this.context);
  }
}
