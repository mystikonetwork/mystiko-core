import { BaseSigner, MetaMaskSigner, checkSigner } from '../../src/chain/signer.js';
import { readFromFile } from '../../src/config/mystikoConfig.js';
import { toHex } from '../../src/utils.js';

class MockProvider {
  constructor(accounts, chainId) {
    this.accounts = accounts;
    this.chainId = chainId;
    this.connected = false;
  }

  async request({ method }) {
    expect(method).not.toBe(undefined);
    if (method === 'eth_chainId') {
      return await new Promise((resolve) => resolve(toHex(this.chainId)));
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
  await expect(checkSigner({}, 123)).rejects.toThrow();
  const conf = await readFromFile('tests/config/files/config.test.json');
  const provider = new MockProvider(['0xccac11fe23f9dee6e8d548ec811375af9fe01e55'], 123);
  const signer = new MetaMaskSigner(conf, provider);
  await expect(checkSigner(signer, 123)).rejects.toThrow();
  await signer.connect();
  await expect(checkSigner(signer, 234)).rejects.toThrow();
  await checkSigner(signer, 123);
});
