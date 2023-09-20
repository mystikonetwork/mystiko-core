import { ProviderPool } from '@mystikonetwork/ethers';
import { RelayerConfig } from '@mystikonetwork/gas-relayer-config';
import { RelayerHandler } from './relayer';
import { IHandlerFactory } from '../../interface';

type HandlerFactoryInterface = IHandlerFactory<RelayerHandler>;

export class HandlerFactory implements HandlerFactoryInterface {
  private readonly providers: ProviderPool;

  private readonly relayerConfig: RelayerConfig;

  private readonly defaultTimeoutMs: number;

  private readonly defaultIntervalMs: number;

  constructor(providers: ProviderPool, relayerConfig: RelayerConfig, timeoutMs: number, intervalMs: number) {
    this.providers = providers;
    this.relayerConfig = relayerConfig;
    this.defaultTimeoutMs = timeoutMs;
    this.defaultIntervalMs = intervalMs;
  }

  createRelayerHandler(): RelayerHandler {
    return new RelayerHandler(this.providers, this.relayerConfig, this.defaultTimeoutMs, this.defaultIntervalMs);
  }
}
