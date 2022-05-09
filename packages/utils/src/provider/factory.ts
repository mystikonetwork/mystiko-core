import { ethers } from 'ethers';
import { check } from '../check';
import { ReconnectingWebSocketProvider } from './websocket';
import FallbackProvider from './fallback';

export interface ProviderConnection extends ethers.utils.ConnectionInfo {
  maxTryCount?: number;
}

export interface ProviderFactory {
  createProvider(connections: Array<string | ProviderConnection>): ethers.providers.Provider;
}

export class DefaultProviderFactory implements ProviderFactory {
  // eslint-disable-next-line class-methods-use-this
  public createProvider(connections: Array<string | ProviderConnection>): ethers.providers.Provider {
    check(connections.length > 0, 'urls cannot be an empty array');
    const providers: ethers.providers.BaseProvider[] = [];
    connections.forEach((connection) => {
      const url = typeof connection === 'string' ? connection : connection.url;
      if (url.match(/^wss?:\/\//)) {
        providers.push(
          new ReconnectingWebSocketProvider(url, {
            timeoutMs: typeof connection !== 'string' ? connection.timeout : undefined,
            maxTryCount: typeof connection !== 'string' ? connection.maxTryCount : undefined,
          }),
        );
      } else if (url.match(/^https?:\/\//)) {
        providers.push(new ethers.providers.JsonRpcProvider(connection));
      } else {
        throw new Error(`unsupported url scheme: ${url}`);
      }
    });
    if (providers.length > 1) {
      return new FallbackProvider(providers);
    }
    return providers[0];
  }
}
