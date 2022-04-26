// eslint-disable-next-line max-classes-per-file
import { ethers } from 'ethers';
import { MystikoConfig } from '@mystikonetwork/config';
import { ProviderConnection, toHex } from '@mystikonetwork/utils';
import { BaseSigner, MetaMaskSigner, PrivateKeySigner, checkSigner, ProviderPoolImpl } from '../../src';

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

let config: MystikoConfig;

beforeEach(async () => {
  config = await MystikoConfig.createFromPlain({
    version: '0.1.0',
    chains: [
      {
        chainId: 3,
        name: 'Ethereum Ropsten',
        assetSymbol: 'ETH',
        explorerUrl: 'https://ropsten.etherscan.io',
        signerEndpoint: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        providers: [
          { url: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' },
          { url: 'https://eth-ropsten.alchemyapi.io/v2/kf1OjEJTu_kWaRHNIHLqRNDUeP4rV3j5' },
        ],
      },
      {
        chainId: 5,
        name: 'Ethereum Goerli',
        assetSymbol: 'ETH',
        explorerUrl: 'https://goerli.etherscan.io',
        signerEndpoint: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        providers: [
          { url: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' },
          { url: 'https://eth-goerli.alchemyapi.io/v2/X0WmNwQWIjARyvQ2io1aZk0F3IjJ2qcM' },
        ],
      },
    ],
  });
});

test('test base signer', async () => {
  await testSigner(new BaseSigner(config));
});

test('test metamask signer', async () => {
  await testSigner(new MetaMaskSigner(config));
  const provider = new MockProvider(['0xccac11fe23f9dee6e8d548ec811375af9fe01e55'], 123);
  const signer = new MetaMaskSigner(config, provider);
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
  const signer1 = new MetaMaskSigner(config, provider1);
  expect((await signer1.connect()).length).toBe(0);
});

test('test private key signer', async () => {
  const providerPool = new ProviderPoolImpl(config, undefined, {
    createProvider: (connections) => new MockEtherProvider(connections[0], 3),
  });
  const signer = new PrivateKeySigner(config, providerPool);
  expect(await signer.installed()).toBe(true);
  expect(await signer.connected()).toBe(false);
  expect(await signer.chainId()).toBe('undefined');
  expect(await signer.accounts()).toStrictEqual([]);
  const etherWallet = ethers.Wallet.createRandom();
  signer.setPrivateKey(etherWallet.privateKey);
  expect(await signer.connect()).toStrictEqual([etherWallet.address]);
  expect(await signer.connected()).toBe(true);
  expect(await signer.accounts()).toStrictEqual([etherWallet.address]);
  const chainConfig = config.getChainConfig(3);
  if (chainConfig) {
    await signer.switchChain(3, chainConfig);
    expect(signer.signer).not.toBe(undefined);
    expect(signer.signer instanceof ethers.Signer).toBe(true);
    expect(await signer.chainId()).toBe('0x3');
    expect(await signer.chainName()).toBe('Ethereum Ropsten');
    expect(await signer.accounts()).toStrictEqual([etherWallet.address]);
  } else {
    throw new Error('no expected chainConfig found');
  }
});

test('test checkSigner', async () => {
  const provider = new MockProvider(['0xccac11fe23f9dee6e8d548ec811375af9fe01e55'], 1);
  const signer = new MetaMaskSigner(config, provider);
  await expect(checkSigner(signer, 3, config)).rejects.toThrow();
  await signer.connect();
  await expect(checkSigner(signer, 10000, config)).rejects.toThrow();
  await checkSigner(signer, 3, config);
  await checkSigner(signer, 5, config);
  expect(await signer.chainId()).toBe(toHex(5));
});

test('test MetaMask switchChain', async () => {
  const provider = new MockProvider(['0xccac11fe23f9dee6e8d548ec811375af9fe01e55'], 3);
  const signer = new MetaMaskSigner(config, provider);
  const chainConfig = config.getChainConfig(5);
  if (chainConfig) {
    await expect(new MetaMaskSigner(config).switchChain(5, chainConfig)).rejects.toThrow();
    await signer.switchChain(5, chainConfig);
    expect(await signer.chainId()).toBe(toHex(5));
    expect(provider.addChainCount).toBe(1);
    const chainConfig1 = config.getChainConfig(3);
    if (chainConfig1) {
      await signer.switchChain(3, chainConfig1);
      expect(provider.addChainCount).toBe(1);
      await expect(signer.switchChain(3, chainConfig)).rejects.toThrow();
    } else {
      throw new Error('no expected chainConfig found');
    }
    const rawConfig = config.copyData();
    rawConfig.chains[1].chainId = 255;
    const newConfig = await MystikoConfig.createFromRaw(rawConfig);
    const newChainConfig = newConfig.getChainConfig(255);
    if (newChainConfig) {
      await expect(signer.switchChain(255, newChainConfig)).rejects.toThrow();
    } else {
      throw new Error('no expected chain found');
    }
  } else {
    throw new Error('no expected chainConfig found');
  }
});
