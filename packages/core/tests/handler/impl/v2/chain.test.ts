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
        chainId: 11155111,
        name: 'Ethereum Sepolia',
        assetSymbol: 'ETH',
        explorerUrl: 'https://sepolia.etherscan.io',
        explorerApiUrl: 'https://api-sepolia.etherscan.io',
        signerEndpoint: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        providers: [
          {
            url: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
            timeoutMs: 1000,
            maxTryCount: 3,
            quorumWeight: 5,
          },
          {
            url: 'https://eth-sepolia.alchemyapi.io/v2/kf1OjEJTu_kWaRHNIHLqRNDUeP4rV3j5',
            timeoutMs: 2000,
            maxTryCount: 4,
            quorumWeight: 6,
          },
        ],
        eventFilterSize: 100000,
        packerGranularities: [4000, 8000],
      },
      {
        chainId: 5,
        name: 'Ethereum Goerli',
        assetSymbol: 'ETH',
        explorerUrl: 'https://goerli.etherscan.io',
        explorerApiUrl: 'https://api-goerli.etherscan.io',
        signerEndpoint: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        providers: [
          {
            url: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
            timeoutMs: 3000,
            maxTryCount: 5,
            quorumWeight: 7,
          },
          {
            url: 'https://eth-goerli.alchemyapi.io/v2/X0WmNwQWIjARyvQ2io1aZk0F3IjJ2qcM',
            timeoutMs: 4000,
            maxTryCount: 6,
            quorumWeight: 8,
          },
        ],
        eventFilterSize: 200000,
        packerGranularities: [4000, 8000],
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
    selector: { chainId: 11155111 },
  });
  expect(chains.length).toBe(1);
  expect(chains[0].name).toBe(config.getChainConfig(11155111)?.name);
  expect(chains[0].eventFilterSize).toBe(config.getChainConfig(11155111)?.eventFilterSize);
  expect(chains[0].providers.map((p) => p.url)).toStrictEqual(
    config.getChainConfig(11155111)?.providers.map((p) => p.url),
  );
});

test('test findOne', async () => {
  await handler.init();
  expect(await handler.findOne(10)).toBe(null);
  expect((await handler.findOne(11155111))?.name).toBe(config.getChainConfig(11155111)?.name);
});

test('test init', async () => {
  await handler.init();
  expect((await handler.find()).length).toBe(2);
  const updatedAt = (await handler.findOne(11155111))?.updatedAt;
  let rawConfig = config.copyData();
  rawConfig.chains[0].eventFilterSize = 700000000;
  rawConfig.chains[1].chainId = 10;
  context.config = await MystikoConfig.createFromRaw(rawConfig);
  await handler.init();
  expect((await handler.find()).length).toBe(3);
  expect((await handler.findOne(11155111))?.eventFilterSize).toBe(700000000);
  expect((await handler.findOne(11155111))?.updatedAt).not.toBe(updatedAt);
  expect(await handler.findOne(10)).not.toBe(null);
  const chain1 = await handler.findOne(11155111);
  if (!chain1) {
    throw new Error('chain id=3 should not be undefined');
  }
  await chain1.update({ $set: { providerOverride: 1, nameOverride: 1, name: 'Changed Name' } });
  rawConfig = config.copyData();
  rawConfig.chains[0].providers = [rawConfig.chains[0].providers[1]];
  rawConfig.chains[1].providers = [rawConfig.chains[1].providers[0]];
  context.config = await MystikoConfig.createFromRaw(rawConfig);
  await handler.init();
  expect((await handler.findOne(11155111))?.providers.length).toBe(2);
  expect((await handler.findOne(11155111))?.name).toBe('Changed Name');
  expect((await handler.findOne(5))?.providers.length).toBe(1);
});

test('test update', async () => {
  expect(await handler.update(11155111, {})).toBe(null);
  await handler.init();
  const chain = await handler.findOne(11155111);
  const name = chain?.name;
  let updatedAt = chain?.updatedAt;
  const providers = chain?.providers;
  await handler.update(11155111, {});
  await handler.update(11155111, { name: '', providers: [] });
  expect(chain?.name).toBe(name);
  expect(chain?.updatedAt).toBe(updatedAt);
  expect(chain?.providers).toStrictEqual(providers);
  await handler.update(11155111, {
    providers: [
      { url: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' },
      { url: 'https://eth-sepolia.alchemyapi.io/v2/kf1OjEJTu_kWaRHNIHLqRNDUeP4rV3j5' },
    ],
  });
  expect(chain?.name).toBe(name);
  expect(chain?.updatedAt).toBe(updatedAt);
  expect(chain?.providers).toStrictEqual(providers);
  expect(chain?.name).toBe(name);
  expect(chain?.updatedAt).toBe(updatedAt);
  await handler.update(11155111, { name });
  await handler.update(11155111, {
    name: 'New Chain Name',
    providers: [
      {
        url: 'https://eth-sepolia.alchemyapi.io/v2/kf1OjEJTu_kWaRHNIHLqRNDUeP4rV3j5',
      },
      {
        url: 'http://localhost:34567',
        maxTryCount: 10,
        timeoutMs: 1000,
        quorumWeight: 5,
      },
      {
        url: 'http://localhost:12345',
      },
    ],
  });
  expect(chain?.name).toBe('New Chain Name');
  expect(chain?.nameOverride).toBe(1);
  expect(chain?.updatedAt).not.toBe(updatedAt);
  expect(chain?.providers.map((p) => p.url)).toStrictEqual([
    'https://eth-sepolia.alchemyapi.io/v2/kf1OjEJTu_kWaRHNIHLqRNDUeP4rV3j5',
    'http://localhost:34567',
    'http://localhost:12345',
  ]);
  expect(chain?.providerOverride).toBe(1);
  expect(chain?.providers.map((p) => p.timeoutMs)).toStrictEqual([2000, 1000, undefined]);
  expect(chain?.providers.map((p) => p.maxTryCount)).toStrictEqual([4, 10, undefined]);
  expect(chain?.providers.map((p) => p.quorumWeight)).toStrictEqual([6, 5, undefined]);
  updatedAt = chain?.updatedAt;
  await handler.update(11155111, {
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
});

test('test update invalid url', async () => {
  await handler.init();
  await expect(
    handler.update(11155111, { providers: [{ url: 'http://localhost:12345' }, { url: 'not_a_url' }] }),
  ).rejects.toThrow(createError('invalid provider url not_a_url', MystikoErrorCode.INVALID_PROVIDER_URL));
});

test('test reset', async () => {
  await handler.init();
  await handler.update(11155111, {
    name: 'My New Name',
    providers: [
      { url: 'http://localhost:34567' },
      { url: 'http://localhost:34567' },
      { url: 'http://localhost:12345' },
    ],
  });
  await handler.update(5, {
    name: 'My New Name',
    providers: [{ url: 'http://localhost:34567' }, { url: 'http://localhost:12345' }],
  });
  expect(await handler.reset(100)).toBe(null);
  let chain = await handler.reset(11155111);
  expect(chain?.name).toBe('Ethereum Sepolia');
  expect(chain?.providers.map((p) => p.url)).toStrictEqual([
    'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    'https://eth-sepolia.alchemyapi.io/v2/kf1OjEJTu_kWaRHNIHLqRNDUeP4rV3j5',
  ]);
  expect(chain?.nameOverride).toBe(undefined);
  expect(chain?.providerOverride).toBe(undefined);
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
