import { ethers } from 'ethers';
import { DefaultProviderFactory, FallbackProvider, ReconnectingWebSocketProvider } from '../../src';
import { buildServer, closeServer } from './websocket-server';

test('test DefaultProviderFactory', async () => {
  const wsServer = await buildServer(39737);
  const factory = new DefaultProviderFactory();
  const provider1 = factory.createProvider([
    {
      url: 'ws://localhost:39737',
      timeout: 500,
      maxTryCount: 5,
    },
  ]);
  expect(provider1 instanceof ReconnectingWebSocketProvider).toBe(true);
  expect((provider1 as ReconnectingWebSocketProvider).timeoutMs).toBe(500);
  expect((provider1 as ReconnectingWebSocketProvider).maxTryCount).toBe(5);
  await (provider1 as ReconnectingWebSocketProvider).destroy();
  const provider2 = factory.createProvider([{ url: 'http://localhost:8888' }]);
  expect(provider2 instanceof ethers.providers.JsonRpcProvider).toBe(true);
  const provider3 = factory.createProvider(['ws://localhost:39737', 'http://localhost:8888']);
  expect(provider3 instanceof FallbackProvider).toBe(true);
  await ((provider3 as FallbackProvider).providers[0] as ReconnectingWebSocketProvider).destroy();
  expect(() => factory.createProvider(['file://abc.socket'])).toThrow();
  await closeServer(wsServer);
});
