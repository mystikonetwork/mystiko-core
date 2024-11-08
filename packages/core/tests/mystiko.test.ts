import { DEFAULT_IP_API } from '@mystikonetwork/utils';
import nock from 'nock';
import { CONFIG_BASE_URL, MystikoConfig } from '@mystikonetwork/config';
import { CONFIG_BASE_URL as RELAYER_CONFIG_BASE_URL } from '@mystikonetwork/gas-relayer-config';
import { ZKProverFactory } from '@mystikonetwork/zkp';
import { ZokratesNodeProverFactory } from '@mystikonetwork/zkp-node';
import { DEFAULT_IP_PRO_API, Mystiko } from '../src';

class TestMystiko extends Mystiko {
  protected zkProverFactory(): Promise<ZKProverFactory> {
    return Promise.resolve(new ZokratesNodeProverFactory());
  }
}

function checkMystiko(mystiko: Mystiko) {
  expect(mystiko.db).not.toBe(undefined);
  expect(mystiko.config).not.toBe(undefined);
  expect(mystiko.logger).not.toBe(undefined);
  expect(mystiko.chains).not.toBe(undefined);
  expect(mystiko.contracts).not.toBe(undefined);
  expect(mystiko.wallets).not.toBe(undefined);
  expect(mystiko.accounts).not.toBe(undefined);
  expect(mystiko.assets).not.toBe(undefined);
  expect(mystiko.commitments).not.toBe(undefined);
  expect(mystiko.deposits).not.toBe(undefined);
  expect(mystiko.transactions).not.toBe(undefined);
  expect(mystiko.signers).not.toBe(undefined);
  expect(mystiko.transactions).not.toBe(undefined);
  expect(mystiko.signers).not.toBe(undefined);
  expect(mystiko.synchronizer).not.toBe(undefined);
}

test('test initialize', async () => {
  nock(CONFIG_BASE_URL).get('/production/testnet/latest.json').reply(200, { version: '1.0.0' });
  nock(RELAYER_CONFIG_BASE_URL).get('/production/testnet/latest.json').reply(200, { version: '1.0.0' });
  const mystiko = new TestMystiko();
  await mystiko.initialize();
  expect(mystiko.config?.version).toBe('1.0.0');
  checkMystiko(mystiko);
  await mystiko.db?.remove();
});

test('test initialize with remote and fallback', async () => {
  nock(CONFIG_BASE_URL).get('/production/testnet/latest.json').reply(503, '');
  nock(RELAYER_CONFIG_BASE_URL).get('/production/testnet/latest.json').reply(503, '');
  const mystiko = new TestMystiko();
  await mystiko.initialize();
  expect(mystiko.config?.version).toBe('0.2.0');
  checkMystiko(mystiko);
  await mystiko.db?.remove();
});

test('test initialize with config file', async () => {
  const mystiko = new TestMystiko();
  nock(RELAYER_CONFIG_BASE_URL).get('/production/testnet/latest.json').reply(200, { version: '1.0.0' });
  await mystiko.initialize({ conf: 'tests/files/config.test.json' });
  checkMystiko(mystiko);
  const chains = await mystiko.chains?.find();
  if (chains) {
    await Promise.all(
      chains.map((c) => c.update({ $set: { providers: [{ url: 'http://localhost:32134' }] } })),
    );
  }
  const provider = await mystiko.providers?.getProvider(11155111);
  await expect(provider?.getNetwork()).rejects.toThrow();
  await mystiko.db?.remove();
});

test('test initialize with config object', async () => {
  const conf = await MystikoConfig.createFromFile('tests/files/config.test.json');
  nock(RELAYER_CONFIG_BASE_URL).get('/production/testnet/latest.json').reply(200, { version: '1.0.0' });
  const mystiko = new TestMystiko();
  await mystiko.initialize({ conf });
  checkMystiko(mystiko);
  await mystiko.db?.remove();
});

test('test isBlacklisted', async () => {
  nock(DEFAULT_IP_API).get('/').reply(200, { country_code: 'CN' });
  nock(RELAYER_CONFIG_BASE_URL).get('/production/testnet/latest.json').reply(200, { version: '1.0.0' });
  const mystiko = new TestMystiko();
  await mystiko.initialize({ conf: 'tests/files/config.test.json' });
  expect(await mystiko.isBlacklisted()).toBe(true);
  nock(DEFAULT_IP_API).get('/').reply(200, { country_code: 'IO' });
  expect(await mystiko.isBlacklisted()).toBe(true);
  await mystiko.db?.remove();
});

test('test isBlacklisted with api key', async () => {
  const apiKey = 'my_awesome_api_key';
  nock(DEFAULT_IP_PRO_API).get(`/?key=${apiKey}`).reply(200, { country_code: 'CN' });
  nock(RELAYER_CONFIG_BASE_URL).get('/production/testnet/latest.json').reply(200, { version: '1.0.0' });
  const mystiko = new TestMystiko();
  await mystiko.initialize({ conf: 'tests/files/config.test.json', ipWhoisApiKey: apiKey });
  expect(await mystiko.isBlacklisted()).toBe(true);
  nock(DEFAULT_IP_API).get('/').reply(200, { country_code: 'IO' });
  expect(await mystiko.isBlacklisted()).toBe(true);
  await mystiko.db?.remove();
});

test('test isBlacklisted false', async () => {
  nock(DEFAULT_IP_API).get('/').reply(200, {});
  nock(RELAYER_CONFIG_BASE_URL).get('/production/testnet/latest.json').reply(200, { version: '1.0.0' });
  const mystiko = new TestMystiko();
  await mystiko.initialize({ conf: 'tests/files/config.test.json', ipWhoisApiKey: '' });
  expect(await mystiko.isBlacklisted()).toBe(false);
  nock(DEFAULT_IP_API).get('/').reply(200, { country_code: 'IO' });
  expect(await mystiko.isBlacklisted()).toBe(false);
  await mystiko.db?.remove();
});

test('test isBlacklisted raise error', async () => {
  nock(DEFAULT_IP_API).get('/').reply(500, { country_code: 'CN' });
  nock(RELAYER_CONFIG_BASE_URL).get('/production/testnet/latest.json').reply(200, { version: '1.0.0' });
  const mystiko = new TestMystiko();
  await mystiko.initialize({ conf: 'tests/files/config.test.json' });
  expect(await mystiko.isBlacklisted()).toBe(false);
  await mystiko.db?.remove();
});

test('test isBlacklisted before initialization', async () => {
  nock(DEFAULT_IP_API).get('/').reply(200, { country_code: 'CN' });
  const mystiko = new TestMystiko();
  expect(await mystiko.isBlacklisted()).toBe(false);
  await mystiko.db?.remove();
});

test('test isBlacklisted when countryBlacklist is empty', async () => {
  nock(DEFAULT_IP_API).get('/').reply(200, { country_code: 'CN' });
  nock(RELAYER_CONFIG_BASE_URL).get('/production/testnet/latest.json').reply(200, { version: '1.0.0' });
  const config = await MystikoConfig.createFromPlain({ version: '0.1.0', countryBlacklist: [] });
  const mystiko = new TestMystiko();
  await mystiko.initialize({ conf: config });
  expect(await mystiko.isBlacklisted()).toBe(false);
  await mystiko.db?.remove();
});
