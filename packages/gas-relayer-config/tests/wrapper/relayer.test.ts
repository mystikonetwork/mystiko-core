import { RelayerConfig } from '../../src';

test('test createDefaultTestnetConfig', async () => {
  await RelayerConfig.createDefaultTestnetConfig();
});

test('test createDefaultMainnetConfig', async () => {
  await RelayerConfig.createDefaultMainnetConfig();
});
