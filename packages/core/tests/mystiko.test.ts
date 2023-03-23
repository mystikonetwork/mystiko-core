import { DEFAULT_IP_API } from '@mystikonetwork/utils';
import nock from 'nock';
import { MystikoConfig } from '@mystikonetwork/config';
import { ZKProverFactory } from '@mystikonetwork/zkp';
import { ZokratesNodeProverFactory } from '@mystikonetwork/zkp-node';
import { Mystiko } from '../src';

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
  const mystiko = new TestMystiko();
  await mystiko.initialize();
  checkMystiko(mystiko);
  await mystiko.db?.remove();
});

test('test initialize with config file', async () => {
  const mystiko = new TestMystiko();
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
  const mystiko = new TestMystiko();
  await mystiko.initialize({ conf });
  checkMystiko(mystiko);
  await mystiko.db?.remove();
});

test('test isBlacklisted', async () => {
  nock(DEFAULT_IP_API).get('/').reply(200, { country_code: 'CN' });
  const mystiko = new TestMystiko();
  await mystiko.initialize({ conf: 'tests/files/config.test.json' });
  expect(await mystiko.isBlacklisted()).toBe(true);
  nock(DEFAULT_IP_API).get('/').reply(200, { country_code: 'IO' });
  expect(await mystiko.isBlacklisted()).toBe(true);
  await mystiko.db?.remove();
});

test('test isBlacklisted false', async () => {
  nock(DEFAULT_IP_API).get('/').reply(200, {});
  const mystiko = new TestMystiko();
  await mystiko.initialize({ conf: 'tests/files/config.test.json' });
  expect(await mystiko.isBlacklisted()).toBe(false);
  nock(DEFAULT_IP_API).get('/').reply(200, { country_code: 'IO' });
  expect(await mystiko.isBlacklisted()).toBe(false);
  await mystiko.db?.remove();
});

test('test isBlacklisted raise error', async () => {
  nock(DEFAULT_IP_API).get('/').reply(500, { country_code: 'CN' });
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
