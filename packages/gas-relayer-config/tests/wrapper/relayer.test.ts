import { RelayerConfig } from '../../src';

test('test createDefaultTestnetConfig', async () => {
  await RelayerConfig.createFromFile('../core/src/config/mystiko_relayer_config/config/testnet/config.json');
});

test('test createDefaultMainnetConfig', async () => {
  await RelayerConfig.createFromFile('../core/src/config/mystiko_relayer_config/config/mainnet/config.json');
});
