import { ethers } from 'ethers';
import { FallbackProvider, TimeoutError } from '../../src';

class TestProvider extends ethers.providers.BaseProvider {
  public error?: ethers.errors | TimeoutError;

  private readonly chainId: number;

  private readonly chainName: string;

  constructor(chainId: number, chainName: string, network?: ethers.providers.Network) {
    super(network || Promise.resolve({ chainId, name: chainName }));
    this.chainId = chainId;
    this.chainName = chainName;
  }

  public detectNetwork(): Promise<ethers.providers.Network> {
    if (this.error instanceof TimeoutError) {
      return Promise.reject(this.error);
    }
    if (this.error) {
      return Promise.reject(ethers.logger.makeError('error', this.error));
    }
    return Promise.resolve({ name: this.chainName, chainId: this.chainId });
  }

  public perform(method: string, params: any): Promise<any> {
    if (this.error instanceof TimeoutError) {
      return Promise.reject(this.error);
    }
    if (this.error) {
      return Promise.reject(ethers.logger.makeError('error', this.error));
    }
    return Promise.resolve({ method, params, chainName: this.chainName });
  }
}

test('test constructor', async () => {
  expect(() => new FallbackProvider([])).toThrow();
  const provider1 = new TestProvider(1, 'chain 1');
  const provider2 = new TestProvider(1, 'chain 1');
  const fallbackProvider1 = new FallbackProvider([provider1, provider2]);
  await fallbackProvider1.ready;
  expect(fallbackProvider1.network.chainId).toBe(1);
  expect(fallbackProvider1.providers).toStrictEqual([provider1, provider2]);
  const provider3 = new TestProvider(1, 'chain 1', { chainId: 1, name: 'chain 1' });
  const provider4 = new TestProvider(2, 'chain 2', { chainId: 2, name: 'chain 2' });
  expect(() => new FallbackProvider([provider3, provider4])).toThrow();
  const provider5 = new TestProvider(1, 'chain 1');
  const provider6 = new TestProvider(2, 'chain 2', { chainId: 2, name: 'chain 2' });
  const fallbackProvider2 = new FallbackProvider([provider5, provider6]);
  await fallbackProvider2.ready;
  expect(fallbackProvider2.network.chainId).toBe(2);
  expect(fallbackProvider2.providers).toStrictEqual([provider5, provider6]);
});

test('test detectNetwork', async () => {
  const provider1 = new TestProvider(1, 'chain 1 #1', { chainId: 1, name: 'chain 1 #1' });
  const provider2 = new TestProvider(1, 'chain 1 #2', { chainId: 1, name: 'chain 1 #2' });
  provider1.error = ethers.errors.UNKNOWN_ERROR;
  const fallbackProvider = new FallbackProvider([provider1, provider2]);
  expect((await fallbackProvider.detectNetwork()).name).toBe('chain 1 #2');
  provider2.error = ethers.errors.UNKNOWN_ERROR;
  await expect(fallbackProvider.detectNetwork()).rejects.toThrow();
  provider1.error = undefined;
  expect((await fallbackProvider.detectNetwork()).name).toBe('chain 1 #1');
});

test('test perform', async () => {
  const provider1 = new TestProvider(1, 'chain 1 #1', { chainId: 1, name: 'chain 1 #1' });
  const provider2 = new TestProvider(1, 'chain 1 #2', { chainId: 1, name: 'chain 1 #2' });
  const retryableErrors = [
    new TimeoutError('timeout'),
    ethers.errors.SERVER_ERROR,
    ethers.errors.TIMEOUT,
    ethers.errors.UNKNOWN_ERROR,
    ethers.errors.UNSUPPORTED_OPERATION,
    ethers.errors.NETWORK_ERROR,
  ];
  const fallbackProvider = new FallbackProvider([provider1, provider2]);
  for (let i = 0; i < retryableErrors.length; i += 1) {
    provider1.error = retryableErrors[i];
    // eslint-disable-next-line no-await-in-loop
    const result = await fallbackProvider.perform('m', 'p');
    expect(result.chainName).toBe('chain 1 #2');
  }
  provider1.error = ethers.errors.CALL_EXCEPTION;
  await expect(fallbackProvider.perform('m', 'p')).rejects.toThrow();
  provider1.error = undefined;
  const result = await fallbackProvider.perform('m', 'p');
  expect(result.chainName).toBe('chain 1 #1');
});
