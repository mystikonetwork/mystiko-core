import { IRelayerHandler } from './relayer';

export interface IHandlerFactory<R extends IRelayerHandler = IRelayerHandler> {
  createRelayerHandler(): R;
}
