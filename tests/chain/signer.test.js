import { BaseSigner, MetaMaskSigner, checkSigner } from '../../src/chain/signer.js';
import { readFromFile } from '../../src/config';
import { toHex } from '../../src/utils.js';

class MockProvider {
  constructor(accounts, chainId) {
    this.accounts = accounts;
    this.chainId = toHex(chainId);
    this.chainIds = [toHex(chainId)];
    this.addChainCount = 0;
    this.connected = false;
  }

  async request({ method, params }) {
    expect(method).not.toBe(undefined);
    if (method === 'eth_chainId') {
      return await new Promise((resolve) => resolve(this.chainId));
    }
    if (method === 'eth_requestAccounts') {
      this.connected = true;
      return await new Promise((resolve) => resolve(this.accounts));
    }
    if (method === 'eth_accounts') {
      if (this.connected) {
        return await new Promise((resolve) => resolve(this.accounts));
      } else {
        return await new Promise((resolve) => resolve([]));
      }
    }
    if (method === 'wallet_switchEthereumChain') {
      expect(params.length).toBe(1);
      expect(params[0].chainId).not.toBe(undefined);
      if (params[0].chainId === '0xff') {
        throw new Error('magic error');
      }
      if (this.chainIds.indexOf(params[0].chainId) === -1) {
        throw { code: 4902 };
      }
      this.chainId = params[0].chainId;
      return await new Promise((resolve) => resolve());
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
      this.addChainCount = this.addChainCount + 1;
      return await new Promise((resolve) => resolve());
    }
    throw new Error('unexpected method');
  }
}

async function testSigner(conf, signer) {
  expect(await signer.connected()).toBe(false);
  expect(await signer.installed()).toBe(false);
  await expect(signer.accounts()).rejects.toThrow();
  await expect(signer.chainId()).rejects.toThrow();
  await expect(signer.connect()).rejects.toThrow();
  const provider = new MockProvider(['0xccac11fe23f9dee6e8d548ec811375af9fe01e55'], 123);
  signer = new MetaMaskSigner(conf, provider);
  expect(await signer.connected()).toBe(false);
  expect(await signer.installed()).toBe(false);
  expect((await signer.accounts()).length).toBe(0);
  expect(await signer.chainId()).toBe('0x7b');
  expect((await signer.connect()).length).toBe(1);
  expect((await signer.connect())[0]).toBe('0xccac11fe23f9dee6e8d548ec811375af9fe01e55');
  expect(await signer.connected()).toBe(true);
  expect(signer.signer).not.toBe(undefined);
}

test('test base signer', async () => {
  const conf = await readFromFile('tests/config/files/config.test.json');
  await testSigner(conf, new BaseSigner(conf));
});

test('test metamask signer', async () => {
  const conf = await readFromFile('tests/config/files/config.test.json');
  await testSigner(conf, new MetaMaskSigner(conf));
});

test('test checkSigner', async () => {
  const conf = await readFromFile('tests/config/files/config.test.json');
  await expect(checkSigner({}, 123, conf)).rejects.toThrow();
  const provider = new MockProvider(['0xccac11fe23f9dee6e8d548ec811375af9fe01e55'], 1);
  const signer = new MetaMaskSigner(conf, provider);
  await expect(checkSigner(signer, 1, conf)).rejects.toThrow();
  await signer.connect();
  await checkSigner(signer, 1, conf);
  await checkSigner(signer, 56, conf);
  expect(await signer.chainId()).toBe(toHex(56));
});

test('test switchChain', async () => {
  const conf = await readFromFile('tests/config/files/config.test.json');
  const provider = new MockProvider(['0xccac11fe23f9dee6e8d548ec811375af9fe01e55'], 1);
  const signer = new MetaMaskSigner(conf, provider);
  const chainConfig = conf.getChainConfig(56);
  await signer.switchChain(56, chainConfig);
  expect(await signer.chainId()).toBe(toHex(56));
  expect(provider.addChainCount).toBe(1);
  await signer.switchChain(1, conf.getChainConfig(1));
  expect(provider.addChainCount).toBe(1);
  await expect(signer.switchChain(1, chainConfig)).rejects.toThrow();
  chainConfig.config['chainId'] = 255;
  await expect(signer.switchChain(255, chainConfig)).rejects.toThrow();
});
