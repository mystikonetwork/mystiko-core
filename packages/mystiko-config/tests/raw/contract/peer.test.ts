import { validate } from 'class-validator';
import { RawPeerContractConfig, readRawConfigFromFile } from '../../../src';

let config: RawPeerContractConfig;

beforeEach(() => {
  config = new RawPeerContractConfig();
  config.chainId = 3;
  config.address = '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67';
});

test('test validate success', async () => {
  expect((await validate(config)).length).toBe(0);
});

test('test invalid chainId', async () => {
  config.chainId = -1;
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.chainId = 2.1;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid address', async () => {
  config.address = '0xdeadbeef';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.address = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test import json file', async () => {
  const fileConfig = await readRawConfigFromFile(
    RawPeerContractConfig,
    'tests/files/contract/peer.valid.json',
  );
  expect(fileConfig).toStrictEqual(config);
  await expect(
    readRawConfigFromFile(RawPeerContractConfig, 'tests/files/contract/peer.invalid.json'),
  ).rejects.toThrow();
});
