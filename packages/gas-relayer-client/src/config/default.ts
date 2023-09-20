import { RelayerConfig } from '@mystikonetwork/gas-relayer-config';

export async function defaultRelayerConfig(isTestnet: boolean): Promise<RelayerConfig> {
  let config: RelayerConfig;
  if (!isTestnet) {
    config = await RelayerConfig.createDefaultMainnetConfig();
  } else {
    config = await RelayerConfig.createDefaultTestnetConfig();
  }
  return config;
}
