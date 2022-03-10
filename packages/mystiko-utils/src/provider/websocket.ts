import { ethers } from 'ethers';
import { Logger } from 'loglevel';
import { logger as rootLogger } from '../logger';
import { promiseWithTimeout, TimeoutError } from '../promise';
import { check } from '../check';

export interface ReconnectingWebSocketProviderOptions {
  timeoutMs?: number;
  maxTryCount?: number;
}

export class ReconnectingWebSocketProvider extends ethers.providers.BaseProvider {
  private rawProvider: ethers.providers.WebSocketProvider;

  private readonly url: string;

  private readonly options: ReconnectingWebSocketProviderOptions;

  private readonly logger: Logger;

  constructor(
    urlOrRaw: string | ethers.providers.WebSocketProvider,
    options?: ReconnectingWebSocketProviderOptions,
  ) {
    let rawProvider: ethers.providers.WebSocketProvider;
    if (urlOrRaw instanceof ethers.providers.WebSocketProvider) {
      rawProvider = urlOrRaw;
    } else {
      rawProvider = new ethers.providers.WebSocketProvider(urlOrRaw);
    }
    super(rawProvider.detectNetwork());
    this.url = rawProvider.connection.url;
    this.options = options || {};
    this.logger = rootLogger.getLogger('ReconnectingWebSocketProvider');
    check(this.timeoutMs > 0, 'options.timeoutMs should be greater than 0');
    check(this.maxTryCount > 0, 'options.maxTryCount should be greater than 0');
    this.rawProvider = rawProvider;
  }

  // eslint-disable-next-line class-methods-use-this
  public poll(): Promise<void> {
    return Promise.resolve();
  }

  public detectNetwork(): Promise<ethers.providers.Network> {
    return this.detectNetworkWithRetry(1);
  }

  public perform(method: string, params: any): Promise<any> {
    return this.performWithRetry(method, params, 1);
  }

  public destroy(): Promise<void> {
    return this.rawProvider.destroy();
  }

  public get timeoutMs(): number {
    return this.options.timeoutMs || 5000;
  }

  public get maxTryCount(): number {
    return this.options.maxTryCount || 3;
  }

  private detectNetworkWithRetry(tryCount: number): Promise<ethers.providers.Network> {
    return promiseWithTimeout(this.rawProvider.detectNetwork(), this.timeoutMs).catch((error: any) => {
      if (error instanceof TimeoutError) {
        if (tryCount <= this.maxTryCount) {
          return this.reconnect().then(() => this.detectNetworkWithRetry(tryCount + 1));
        }
      }
      return Promise.reject(error);
    });
  }

  private performWithRetry(method: string, params: any, tryCount: number): Promise<any> {
    return promiseWithTimeout(this.rawProvider.perform(method, params), this.timeoutMs).catch(
      (error: any) => {
        if (error instanceof TimeoutError) {
          if (tryCount <= this.maxTryCount) {
            return this.reconnect().then(() => this.performWithRetry(method, params, tryCount + 1));
          }
        }
        return Promise.reject(error);
      },
    );
  }

  private async reconnect(): Promise<void> {
    this.logger.info(`reconnecting websocket on ${this.url}`);
    await this.destroy();
    this.rawProvider = new ethers.providers.WebSocketProvider(this.url);
  }
}
