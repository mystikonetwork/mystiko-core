import { MystikoContextInterface } from './interface';

export interface ContextFactory<C extends MystikoContextInterface = MystikoContextInterface> {
  createContext(): C;
}
