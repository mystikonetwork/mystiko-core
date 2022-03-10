import { ethers } from 'ethers';
import { check } from '../check';
import { ReconnectingWebSocketProvider, ReconnectingWebSocketProviderOptions } from './websocket';
import FallbackProvider from './fallback';

export interface ProviderFactory {
  createProvider(urls: string[]): ethers.providers.BaseProvider;
}

export class DefaultProviderFactory implements ProviderFactory {
  // eslint-disable-next-line class-methods-use-this
  public createProvider(urls: string[], options?: { [key: string]: any }): ethers.providers.BaseProvider {
    check(urls.length > 0, 'urls cannot be an empty array');
    const providers: ethers.providers.BaseProvider[] = [];
    urls.forEach((url) => {
      const providerOption = options ? options[url] : undefined;
      if (url.match(/^wss?:\/\//)) {
        providers.push(
          new ReconnectingWebSocketProvider(url, providerOption as ReconnectingWebSocketProviderOptions),
        );
      } else if (url.match(/^https?:\/\//)) {
        providers.push(new ethers.providers.JsonRpcProvider(url));
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
