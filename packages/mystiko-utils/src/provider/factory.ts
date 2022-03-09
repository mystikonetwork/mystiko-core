import { ethers } from 'ethers';
import { check } from '../check';
import { ReconnectingWebSocketProvider } from './websocket';
import FallbackProvider from './fallback';

export interface ProviderFactory {
  createProvider(urls: string[]): ethers.providers.BaseProvider;
}

export class DefaultProviderFactory implements ProviderFactory {
  // eslint-disable-next-line class-methods-use-this
  public createProvider(urls: string[]): ethers.providers.BaseProvider {
    check(urls.length > 0, 'urls cannot be an empty array');
    const providers: ethers.providers.BaseProvider[] = [];
    urls.forEach((url) => {
      if (url.startsWith('wss://') || url.startsWith('ws://')) {
        providers.push(new ReconnectingWebSocketProvider(url));
      } else if (url.startsWith('https://') || url.startsWith('http://')) {
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
