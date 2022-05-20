import { MystikoConfig } from '@mystikonetwork/config';
import { Chain } from '@mystikonetwork/database';
import { ChainHandlerV2, createError, MystikoContext, MystikoErrorCode } from '../../../../src';
import { createTestContext } from '../../../common/context';

let config: MystikoConfig;
let context: MystikoContext;
let handler: ChainHandlerV2;

beforeAll(async () => {
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
          {
            url: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
            timeoutMs: 1000,
            maxTryCount: 3,
          },
          {
            url: 'https://eth-ropsten.alchemyapi.io/v2/kf1OjEJTu_kWaRHNIHLqRNDUeP4rV3j5',
            timeoutMs: 2000,
            maxTryCount: 4,
          },
        ],
        eventFilterSize: 100000,
      },
      {
        chainId: 5,
        name: 'Ethereum Goerli',
        assetSymbol: 'ETH',
        explorerUrl: 'https://goerli.etherscan.io',
        signerEndpoint: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        providers: [
          {
            url: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
            timeoutMs: 3000,
            maxTryCount: 5,
          },
          {
            url: 'https://eth-goerli.alchemyapi.io/v2/X0WmNwQWIjARyvQ2io1aZk0F3IjJ2qcM',
            timeoutMs: 4000,
            maxTryCount: 6,
          },
        ],
        eventFilterSize: 200000,
      },
    ],
  });
  context = await createTestContext({ config });
});

beforeEach(() => {
  context.config = config;
  handler = new ChainHandlerV2(context);
});

afterEach(async () => {
  await context.db.chains.clear();
});

afterAll(async () => {
  await context.db.remove();
});

test('test find', async () => {
  expect((await handler.find()).length).toBe(0);
  await handler.init();
  expect((await handler.find()).length).toBe(2);
  let chains: Chain[] = await handler.find({
    selector: { chainId: 5 },
  });
  expect(chains.length).toBe(1);
  expect(chains[0].name).toBe(config.getChainConfig(5)?.name);
  expect(chains[0].eventFilterSize).toBe(config.getChainConfig(5)?.eventFilterSize);
  expect(chains[0].providers.map((p) => p.url)).toStrictEqual(
    config.getChainConfig(5)?.providers.map((p) => p.url),
  );
  chains = await handler.find({
    selector: { chainId: 3 },
  });
  expect(chains.length).toBe(1);
  expect(chains[0].name).toBe(config.getChainConfig(3)?.name);
  expect(chains[0].eventFilterSize).toBe(config.getChainConfig(3)?.eventFilterSize);
  expect(chains[0].providers.map((p) => p.url)).toStrictEqual(
    config.getChainConfig(3)?.providers.map((p) => p.url),
  );
});

test('test findOne', async () => {
  await handler.init();
  expect(await handler.findOne(10)).toBe(null);
  expect((await handler.findOne(3))?.name).toBe(config.getChainConfig(3)?.name);
});

test('test init', async () => {
  await handler.init();
  expect((await handler.find()).length).toBe(2);
  const updatedAt = (await handler.findOne(3))?.updatedAt;
  let rawConfig = config.copyData();
  rawConfig.chains[0].eventFilterSize = 700000000;
  rawConfig.chains[1].chainId = 10;
  context.config = await MystikoConfig.createFromRaw(rawConfig);
  await handler.init();
  expect((await handler.find()).length).toBe(3);
  expect((await handler.findOne(3))?.eventFilterSize).toBe(700000000);
  expect((await handler.findOne(3))?.updatedAt).not.toBe(updatedAt);
  expect(await handler.findOne(10)).not.toBe(null);
  const chain1 = await handler.findOne(3);
  if (!chain1) {
    throw new Error('chain id=3 should not be undefined');
  }
  await chain1.update({ $set: { providerOverride: 1 } });
  rawConfig = config.copyData();
  rawConfig.chains[0].providers = [rawConfig.chains[0].providers[1]];
  rawConfig.chains[1].providers = [rawConfig.chains[1].providers[0]];
  context.config = await MystikoConfig.createFromRaw(rawConfig);
  await handler.init();
  expect((await handler.findOne(3))?.providers.length).toBe(2);
  expect((await handler.findOne(5))?.providers.length).toBe(1);
});

test('test update', async () => {
  expect(await handler.update(3, {})).toBe(null);
  await handler.init();
  const chain = await handler.findOne(3);
  const name = chain?.name;
  let updatedAt = chain?.updatedAt;
  const providers = chain?.providers;
  await handler.update(3, {});
  await handler.update(3, { name: '', providers: [] });
  expect(chain?.name).toBe(name);
  expect(chain?.updatedAt).toBe(updatedAt);
  expect(chain?.providers).toStrictEqual(providers);
  await handler.update(3, {
    providers: [
      { url: 'https://eth-ropsten.alchemyapi.io/v2/kf1OjEJTu_kWaRHNIHLqRNDUeP4rV3j5' },
      { url: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' },
    ],
  });
  expect(chain?.name).toBe(name);
  expect(chain?.updatedAt).toBe(updatedAt);
  expect(chain?.providers).toStrictEqual(providers);
  await handler.update(3, {
    name: 'New Chain Name',
    providers: [
      {
        url: 'https://eth-ropsten.alchemyapi.io/v2/kf1OjEJTu_kWaRHNIHLqRNDUeP4rV3j5',
      },
      {
        url: 'http://localhost:34567',
        maxTryCount: 10,
        timeoutMs: 1000,
      },
      {
        url: 'http://localhost:12345',
      },
    ],
  });
  expect(chain?.name).toBe('New Chain Name');
  expect(chain?.updatedAt).not.toBe(updatedAt);
  expect(chain?.providers.map((p) => p.url)).toStrictEqual([
    'https://eth-ropsten.alchemyapi.io/v2/kf1OjEJTu_kWaRHNIHLqRNDUeP4rV3j5',
    'http://localhost:34567',
    'http://localhost:12345',
  ]);
  expect(chain?.providerOverride).toBe(1);
  expect(chain?.providers.map((p) => p.timeoutMs)).toStrictEqual([2000, 1000, undefined]);
  expect(chain?.providers.map((p) => p.maxTryCount)).toStrictEqual([4, 10, undefined]);
  updatedAt = chain?.updatedAt;
  await handler.update(3, {
    providers: [
      { url: 'http://localhost:34567' },
      { url: 'http://localhost:34567' },
      { url: 'http://localhost:12345' },
    ],
  });
  expect(chain?.updatedAt).not.toBe(updatedAt);
  expect(chain?.providers.map((p) => p.url)).toStrictEqual([
    'http://localhost:34567',
    'http://localhost:34567',
    'http://localhost:12345',
  ]);
  expect(chain?.providerOverride).toBe(1);
  updatedAt = chain?.updatedAt;
  await handler.update(3, {
    providers: [
      { url: 'http://localhost:36666' },
      { url: 'http://localhost:34567' },
      { url: 'http://localhost:12345' },
    ],
  });
  expect(chain?.updatedAt).not.toBe(updatedAt);
  expect(chain?.providers.map((p) => p.url)).toStrictEqual([
    'http://localhost:36666',
    'http://localhost:34567',
    'http://localhost:12345',
  ]);
  expect(chain?.providerOverride).toBe(1);
});

test('test update invalid url', async () => {
  await handler.init();
  await expect(
    handler.update(3, { providers: [{ url: 'http://localhost:12345' }, { url: 'not_a_url' }] }),
  ).rejects.toThrow(createError('invalid provider url not_a_url', MystikoErrorCode.INVALID_PROVIDER_URL));
});

test('test reset', async () => {
  await handler.init();
  await handler.update(3, {
    name: 'My New Name',
    providers: [
      { url: 'http://localhost:34567' },
      { url: 'http://localhost:34567' },
      { url: 'http://localhost:12345' },
    ],
  });
  await handler.update(5, {
    name: 'My New Name',
    providers: [
      { url: 'http://localhost:34567' },
      { url: 'http://localhost:12345' },
    ],
  });
  expect(await handler.reset(100)).toBe(null);
  let chain = await handler.reset(3);
  expect(chain?.name).toBe('Ethereum Ropsten');
  expect(chain?.providers.map((p) => p.url)).toStrictEqual([
    'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    'https://eth-ropsten.alchemyapi.io/v2/kf1OjEJTu_kWaRHNIHLqRNDUeP4rV3j5',
  ]);
  const rawConfig = config.copyData();
  rawConfig.chains[1].chainId = 10;
  context.config = await MystikoConfig.createFromRaw(rawConfig);
  chain = await handler.reset(5);
  expect(chain?.name).toBe('My New Name');
  expect(chain?.providers.map((p) => p.url)).toStrictEqual([
    'http://localhost:34567',
    'http://localhost:12345',
  ]);
});
