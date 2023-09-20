import { RelayerConfig } from '@mystikonetwork/gas-relayer-config';
import { Relayer } from '../src';

describe('Test relayer instance initialize', () => {
  it('should initialize relayer instance successful', async () => {
    const relayer0 = new Relayer();
    await relayer0.initialize();

    expect(relayer0.relayerHandler).not.toBe(undefined);
    expect(relayer0.logger).not.toBe(undefined);

    const relayer1 = new Relayer();
    const relayerConfig = await RelayerConfig.createDefaultTestnetConfig();
    await relayer1.initialize({ isTestnet: false, relayerConfig });
    expect(relayer1.relayerHandler).not.toBe(undefined);
    expect(relayer1.logger).not.toBe(undefined);
  });
});
