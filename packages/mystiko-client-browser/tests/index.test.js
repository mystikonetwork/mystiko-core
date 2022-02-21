import '../src/index.js';
import { MystikoConfig } from '@mystiko/client/src/config';
import DefaultTestnetConfigJson from '@mystiko/contracts/config/default/testnet.json';
import DefaultMainnetConfigJson from '@mystiko/contracts/config/default/mainnet.json';

const DefaultTestnetConfig = new MystikoConfig(DefaultTestnetConfigJson);
const DefaultMainnetConfig = new MystikoConfig(DefaultMainnetConfigJson);

test('test window is set', async () => {
  expect(window.mystiko).not.toBe(undefined);
  await window.mystiko.initialize({ dbAdapter: undefined });
  expect(window.mystiko.config).toStrictEqual(DefaultTestnetConfig);
  await window.mystiko.initialize({ isTestnet: true, dbAdapter: undefined });
  expect(window.mystiko.config).toStrictEqual(DefaultTestnetConfig);
  await window.mystiko.initialize({ isTestnet: false, dbAdapter: undefined });
  expect(window.mystiko.config).toStrictEqual(DefaultMainnetConfig);
});
