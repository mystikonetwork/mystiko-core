// eslint-disable-next-line max-classes-per-file
import { ethers } from 'ethers';
import { ReconnectingWebSocketProvider } from '../../src';
import { buildServer, closeServer } from './websocket-server';

test('test constructor', async () => {
  const server = await buildServer(39734);
  const rawProvider = new ethers.providers.WebSocketProvider('ws://localhost:39734');
  const provider1 = new ReconnectingWebSocketProvider('ws://localhost:39734');
  expect((await provider1.getNetwork()).chainId).toBe(3);
  const provider2 = new ReconnectingWebSocketProvider(rawProvider, { timeoutMs: 1000, maxTryCount: 5 });
  expect((await provider2.getNetwork()).chainId).toBe(3);
  expect(provider2.timeoutMs).toBe(1000);
  expect(provider2.maxTryCount).toBe(5);
  expect(() => new ReconnectingWebSocketProvider(rawProvider, { timeoutMs: -1 })).toThrow();
  expect(() => new ReconnectingWebSocketProvider(rawProvider, { maxTryCount: -1 })).toThrow();
  await provider1.poll();
  await provider2.poll();
  await provider1.destroy();
  await provider2.destroy();
  await closeServer(server);
});

test('test detectNetwork', async () => {
  class TimeoutWebSocketProvider extends ethers.providers.WebSocketProvider {
    // eslint-disable-next-line class-methods-use-this
    public detectNetwork(): Promise<ethers.providers.Network> {
      return new Promise<ethers.providers.Network>((resolve) => {
        setTimeout(resolve, 1000);
      }).then(() => Promise.resolve({ name: 'Ropsten', chainId: 3 }));
    }
  }
  class ErrorWebSocketProvider extends ethers.providers.WebSocketProvider {
    // eslint-disable-next-line class-methods-use-this
    public detectNetwork(): Promise<ethers.providers.Network> {
      return Promise.reject(new Error('something wrong'));
    }
  }
  const server = await buildServer(39735);
  const rawProvider1 = new TimeoutWebSocketProvider('ws://localhost:39735');
  const provider1 = new ReconnectingWebSocketProvider(rawProvider1, { timeoutMs: 500, maxTryCount: 2 });
  expect((await provider1.detectNetwork()).chainId).toBe(3);
  await provider1.destroy();
  const rawProvider2 = new ErrorWebSocketProvider('ws://localhost:39735');
  const provider2 = new ReconnectingWebSocketProvider(rawProvider2, { timeoutMs: 500, maxTryCount: 2 });
  await expect(provider2.detectNetwork()).rejects.toThrow();
  await provider2.destroy();
  await closeServer(server);
});

test('test perform', async () => {
  const server = await buildServer(39736);
  const provider = new ReconnectingWebSocketProvider('ws://localhost:39736', {
    timeoutMs: 500,
    maxTryCount: 2,
  });
  expect(await provider.perform('getTransaction', { transactionHash: '0x' })).not.toBe(undefined);
  await provider.destroy();
  expect(await provider.perform('getTransaction', { transactionHash: '0x' })).not.toBe(undefined);
  await expect(provider.perform('getBlockNumber', {})).rejects.toThrow();
  await closeServer(server);
});
