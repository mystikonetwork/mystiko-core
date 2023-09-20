import { MystikoConfig } from '@mystikonetwork/config';
import { RelayerConfig } from '@mystikonetwork/gas-relayer-config';

describe('Test relayer config', () => {
  it('load relayer config from file', async () => {
    const config = await RelayerConfig.createFromFile('./test/json/testnet_valid.json');
    expect(config.version).toEqual('0.0.1');
    expect(config.chains.length).toEqual(6);

    await expect(RelayerConfig.createFromFile('./test/json/testnet_invalid.json')).rejects.toThrow();
  });

  it('should load default relayer config', async () => {
    await expect(RelayerConfig.createDefaultTestnetConfig()).resolves;
    await expect(RelayerConfig.createDefaultMainnetConfig()).resolves;
  });

  it('should load default mystiko config', async () => {
    await expect(MystikoConfig.createDefaultMainnetConfig()).resolves;
    await expect(MystikoConfig.createDefaultTestnetConfig()).resolves;
  });
});
