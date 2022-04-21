import { MystikoConfig } from '@mystikonetwork/config';
import { Chain, Wallet } from '@mystikonetwork/database';
import { ChainHandlerV2, createError, MystikoContext, MystikoErrorCode, WalletHandlerV2 } from '../../../src';
import { createTestContext } from './context';

let config: MystikoConfig;
let context: MystikoContext;
let handler: ChainHandlerV2;
let wallet: Wallet;
let walletHandler: WalletHandlerV2;

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
          { url: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' },
          { url: 'https://eth-ropsten.alchemyapi.io/v2/kf1OjEJTu_kWaRHNIHLqRNDUeP4rV3j5' },
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
          { url: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' },
          { url: 'https://eth-goerli.alchemyapi.io/v2/X0WmNwQWIjARyvQ2io1aZk0F3IjJ2qcM' },
        ],
        eventFilterSize: 200000,
      },
    ],
  });
  context = await createTestContext(undefined, config);
});

beforeEach(async () => {
  walletHandler = new WalletHandlerV2(context);
  handler = new ChainHandlerV2(context);
  wallet = await walletHandler.create({ masterSeed: 'masterSeed', password: 'P@ssw0rd' });
});

afterEach(async () => {
  await context.db.wallets.clear();
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
  expect(chains[0].providers).toStrictEqual(config.getChainConfig(5)?.providers.map((p) => p.url));
  expect(chains[0].wallet).toBe(wallet.id);
  chains = await handler.find({
    selector: { chainId: 3 },
  });
  expect(chains.length).toBe(1);
  expect(chains[0].name).toBe(config.getChainConfig(3)?.name);
  expect(chains[0].eventFilterSize).toBe(config.getChainConfig(3)?.eventFilterSize);
  expect(chains[0].providers).toStrictEqual(config.getChainConfig(3)?.providers.map((p) => p.url));
  expect(chains[0].wallet).toBe(wallet.id);
  chains = await handler.find({
    selector: { wallet: 'wrong wallet id' },
  });
  expect(chains.length).toBe(2);
  const wallet1 = await walletHandler.create({ masterSeed: 'masterSeed', password: 'P@ssw0rd' });
  expect((await handler.find()).length).toBe(0);
  await handler.init();
  chains = await handler.find({
    selector: { chainId: 3 },
  });
  expect(chains[0].wallet).toBe(wallet1.id);
});

test('test findOne', async () => {
  await handler.init();
  expect(await handler.findOne(10)).toBe(null);
  expect((await handler.findOne(3))?.name).toBe(config.getChainConfig(3)?.name);
  await walletHandler.create({ masterSeed: 'masterSeed', password: 'P@ssw0rd' });
  expect(await handler.findOne(5)).toBe(null);
});

test('test init', async () => {
  await handler.init();
  expect((await handler.find()).length).toBe(2);
  const updatedAt = (await handler.findOne(3))?.updatedAt;
  const rawConfig = config.copyData();
  rawConfig.chains[0].eventFilterSize = 700000000;
  rawConfig.chains[1].chainId = 10;
  context.config = await MystikoConfig.createFromRaw(rawConfig);
  await handler.init();
  expect((await handler.find()).length).toBe(3);
  expect((await handler.findOne(3))?.eventFilterSize).toBe(700000000);
  expect((await handler.findOne(3))?.updatedAt).not.toBe(updatedAt);
  expect(await handler.findOne(10)).not.toBe(null);
});

test('test update', async () => {
  await expect(handler.update(3, {})).rejects.toThrow(
    createError('cannot find chain id=3 in database', MystikoErrorCode.NON_EXISTING_CHAIN),
  );
  await handler.init();
  const chain = await handler.findOne(3);
  const name = chain?.name;
  const updatedAt = chain?.updatedAt;
  const providers = chain?.providers;
  await handler.update(3, {});
  await handler.update(3, { name: '', providers: [] });
  expect(chain?.name).toBe(name);
  expect(chain?.updatedAt).toBe(updatedAt);
  expect(chain?.providers).toStrictEqual(providers);
  await handler.update(3, { name: 'New Chain Name', providers: ['http://localhost:12345'] });
  expect(chain?.name).toBe('New Chain Name');
  expect(chain?.updatedAt).not.toBe(updatedAt);
  expect(chain?.providers).toStrictEqual(['http://localhost:12345']);
});

test('test update invalid url', async () => {
  await handler.init();
  await expect(handler.update(3, { providers: ['http://localhost:12345', 'not_a_url'] })).rejects.toThrow(
    createError('invalid provider url not_a_url', MystikoErrorCode.INVALID_PROVIDER_URL),
  );
});