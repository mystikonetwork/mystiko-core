// eslint-disable-next-line max-classes-per-file
import { ethers } from 'ethers';
import { ChainConfig, readFromFile } from '@mystikonetwork/config';
import { ProviderConnection, toHex } from '@mystikonetwork/utils';
import { BaseSigner, MetaMaskSigner, PrivateKeySigner, checkSigner, ProviderPool } from '../../src';

class MockError extends Error {
  public readonly code: number;

  constructor(code: number) {
    super();
    this.code = code;
  }
}

class MockProvider {
  public readonly accounts: string[];

  public chainId: string;

  public readonly chainIds: string[];

  public addChainCount: number;

  public connected: boolean;

  public readonly listeners: { [key: string]: (message: any) => void };

  constructor(accounts: string[], chainId: number) {
    this.accounts = accounts;
    this.chainId = toHex(chainId);
    this.chainIds = [toHex(chainId)];
    this.addChainCount = 0;
    this.connected = false;
    this.listeners = {};
  }

  request(options: any) {
    const { method, params } = options;
    expect(method).not.toBe(undefined);
    if (method === 'eth_chainId') {
      return Promise.resolve(this.chainId);
    }
    if (method === 'eth_requestAccounts') {
      this.connected = true;
      return Promise.resolve(this.accounts);
    }
    if (method === 'eth_accounts') {
      if (this.connected) {
        return Promise.resolve(this.accounts);
      }
      return Promise.resolve([]);
    }
    if (method === 'wallet_switchEthereumChain') {
      expect(params.length).toBe(1);
      expect(params[0].chainId).not.toBe(undefined);
      if (params[0].chainId === '0xff') {
        throw new Error('magic error');
      }
      if (this.chainIds.indexOf(params[0].chainId) === -1) {
        throw new MockError(4902);
      }
      this.chainId = params[0].chainId;
      return Promise.resolve();
    }
    if (method === 'wallet_addEthereumChain') {
      expect(params.length).toBe(1);
      expect(params[0].chainId).not.toBe(undefined);
      expect(params[0].chainName).not.toBe(undefined);
      expect(params[0].rpcUrls.length > 0).toBe(true);
      expect(params[0].blockExplorerUrls.length > 0).toBe(true);
      expect(this.chainIds.indexOf(params[0].chainId)).toBe(-1);
      this.chainIds.push(params[0].chainId);
      this.chainId = params[0].chainId;
      this.addChainCount += 1;
      return Promise.resolve();
    }
    throw new Error('unexpected method');
  }

  public on(eventName: string, callback: (message: any) => void) {
    this.listeners[eventName] = callback;
  }

  public removeListener(eventName: string, callback: (message: any) => void) {
    expect(this.listeners[eventName]).toBe(callback);
    delete this.listeners[eventName];
  }
}

class MockEtherProvider extends ethers.providers.JsonRpcProvider {
  private readonly expectedChainId: number;

  constructor(rpcEndpoint: string | ProviderConnection, expectedChainId: number) {
    super(rpcEndpoint);
    this.expectedChainId = expectedChainId;
  }

  getNetwork() {
    return Promise.resolve({ chainId: this.expectedChainId, name: '' });
  }
}

async function testSigner(signer: BaseSigner, defaultInstalled = false) {
  expect(await signer.connected()).toBe(false);
  expect(await signer.installed()).toBe(defaultInstalled);
  expect(() => signer.signer).toThrow();
  await expect(signer.accounts()).rejects.toThrow();
  await expect(signer.chainId()).rejects.toThrow();
  await expect(signer.chainName()).rejects.toThrow();
  await expect(signer.connect()).rejects.toThrow();
}

test('test base signer', async () => {
  const conf = await readFromFile('tests/config/config.test.json');
  await testSigner(new BaseSigner(conf));
});

test('test metamask signer', async () => {
  const conf = await readFromFile('tests/config/config.test.json');
  await testSigner(new MetaMaskSigner(conf));
  const provider = new MockProvider(['0xccac11fe23f9dee6e8d548ec811375af9fe01e55'], 123);
  const signer = new MetaMaskSigner(conf, provider);
  expect(await signer.connected()).toBe(false);
  expect(await signer.installed()).toBe(false);
  expect((await signer.accounts()).length).toBe(0);
  expect(await signer.chainId()).toBe('0x7b');
  expect(await signer.chainName()).toBe('Unsupported Network');
  expect((await signer.connect()).length).toBe(1);
  expect((await signer.connect())[0]).toBe('0xccac11fe23f9dee6e8d548ec811375af9fe01e55');
  expect(await signer.connected()).toBe(true);
  const callback = () => {};
  signer.addListener('connect', callback);
  expect(provider.listeners.connect).not.toBe(undefined);
  signer.removeListener('connect', callback);
  expect(provider.listeners.connect).toBe(undefined);
  expect(signer.signer).not.toBe(undefined);
  const provider1 = new MockProvider([], 123);
  const signer1 = new MetaMaskSigner(conf, provider1);
  expect((await signer1.connect()).length).toBe(0);
});

test('test private key signer', async () => {
  const conf = await readFromFile('tests/config/config.test.json');
  const providerPool = new ProviderPool(conf, {
    createProvider: (connections) => new MockEtherProvider(connections[0], 1),
  });
  providerPool.connect();
  const signer = new PrivateKeySigner(conf, providerPool);
  expect(await signer.installed()).toBe(true);
  expect(await signer.connected()).toBe(false);
  expect(await signer.chainId()).toBe('undefined');
  expect(await signer.accounts()).toStrictEqual([]);
  const etherWallet = ethers.Wallet.createRandom();
  signer.setPrivateKey(etherWallet.privateKey);
  expect(await signer.connect()).toStrictEqual([etherWallet.address]);
  expect(await signer.connected()).toBe(true);
  expect(await signer.accounts()).toStrictEqual([etherWallet.address]);
  const chainConfig = conf.getChainConfig(1);
  if (chainConfig) {
    await signer.switchChain(1, chainConfig);
    expect(signer.signer).not.toBe(undefined);
    expect(signer.signer instanceof ethers.Signer).toBe(true);
    expect(await signer.chainId()).toBe('0x1');
    expect(await signer.chainName()).toBe('Ethereum Mainnet');
    expect(await signer.accounts()).toStrictEqual([etherWallet.address]);
  }
});

test('test checkSigner', async () => {
  const conf = await readFromFile('tests/config/config.test.json');
  const provider = new MockProvider(['0xccac11fe23f9dee6e8d548ec811375af9fe01e55'], 1);
  const signer = new MetaMaskSigner(conf, provider);
  await expect(checkSigner(signer, 1, conf)).rejects.toThrow();
  await signer.connect();
  await expect(checkSigner(signer, 10000, conf)).rejects.toThrow();
  await checkSigner(signer, 1, conf);
  await checkSigner(signer, 56, conf);
  expect(await signer.chainId()).toBe(toHex(56));
});

test('test MetaMask switchChain', async () => {
  const conf = await readFromFile('tests/config/config.test.json');
  const provider = new MockProvider(['0xccac11fe23f9dee6e8d548ec811375af9fe01e55'], 1);
  const signer = new MetaMaskSigner(conf, provider);
  const chainConfig = conf.getChainConfig(56);
  if (chainConfig) {
    await expect(new MetaMaskSigner(conf).switchChain(56, chainConfig)).rejects.toThrow();
    await signer.switchChain(56, chainConfig);
    expect(await signer.chainId()).toBe(toHex(56));
    expect(provider.addChainCount).toBe(1);
    const chainConfig1 = conf.getChainConfig(1);
    if (chainConfig1) {
      await signer.switchChain(1, chainConfig1);
      expect(provider.addChainCount).toBe(1);
      await expect(signer.switchChain(1, chainConfig)).rejects.toThrow();
    }
    const newChainConfig = new ChainConfig({ ...chainConfig.getRawConfig(), chainId: 255 });
    await expect(signer.switchChain(255, newChainConfig)).rejects.toThrow();
  }
});
