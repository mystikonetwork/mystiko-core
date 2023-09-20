import { Logger } from 'loglevel';
import { logger as rootLogger } from '@mystikonetwork/utils';
import { ProviderPool } from '@mystikonetwork/ethers';
import { RelayerConfig } from '@mystikonetwork/gas-relayer-config';

export class Handler {
  protected readonly relayerConfig: RelayerConfig;

  protected readonly providers: ProviderPool;

  protected readonly logger: Logger;

  protected readonly defaultTimeoutMs: number;

  protected readonly defaultIntervalMs: number;

  constructor(providers: ProviderPool, config: RelayerConfig, timeoutMs: number, intervalMs: number) {
    this.providers = providers;
    this.relayerConfig = config;
    this.logger = rootLogger.getLogger('GasRelayerHandler');
    this.defaultTimeoutMs = timeoutMs;
    this.defaultIntervalMs = intervalMs;
  }
}
