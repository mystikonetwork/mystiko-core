import { Relayer } from '../../src';
import { CircuitType } from "@mystikonetwork/config";

describe('Test relayer client register info interface', () => {
  let relayer: Relayer;

  beforeAll(async () => {
    relayer = new Relayer();
    await relayer.initialize({ isTestnet: true });
  });

  it('get register url throw exception', async () => {
    await expect(relayer.relayerHandler?.registerInfo({ chainId: 5 })).rejects;
  });
});
