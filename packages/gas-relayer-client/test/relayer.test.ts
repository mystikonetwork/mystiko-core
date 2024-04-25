import { RelayerConfig } from '@mystikonetwork/gas-relayer-config';
import { Relayer } from '../src';

describe('Test relayer instance initialize', () => {
  it('should initialize relayer instance successful', async () => {
    const relayer0 = new Relayer();
    await relayer0.initialize({
      relayerConfig: '../core/src/config/mystiko_relayer_config/config/mainnet/config.json',
      mystikoConfig: '../core/src/config/mystiko_config/config/mainnet/config.json',
    });

    expect(relayer0.relayerHandler).not.toBe(undefined);
    expect(relayer0.logger).not.toBe(undefined);

    const relayer1 = new Relayer();
    await relayer1.initialize({
      isTestnet: false,
      relayerConfig: '../core/src/config/mystiko_relayer_config/config/mainnet/config.json',
      mystikoConfig: '../core/src/config/mystiko_config/config/mainnet/config.json',
    });
    expect(relayer1.relayerHandler).not.toBe(undefined);
    expect(relayer1.logger).not.toBe(undefined);
  });
});
