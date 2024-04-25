import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { Relayer, RelayerError } from '../../src';

function getMockFailedResponse() {
  return {
    code: 0,
    data: {
      id: 'nPauONMKRRCFoLzTUZQ6rg-51',
      type: 'MYSTIKO_TRANSACT',
      request: {
        chainId: 11155111,
        symbol: 'MTT',
        mystikoContractAddress: '0x1B97a7266aA03998Ed43E8Bfa9a154889F799906',
        proof: {
          a: {
            X: '0x09ac729b042b71f76fb8f049010dec44107ed3ac8e568465da3a56ce311ee46b',
            Y: '0x28005555ba6f1fc0049fb1801a97be3ef7e64549368f5175809c97d9c4abaadb',
          },
          b: {
            X: [
              '0x09fe0a1456ec9da1d6d4e20629aa90089242175a7cb530ea43e072e95a302acd',
              '0x1d6c1be0b3ad6af7e0c275dc74bb6867292f2a5f6b714f257f53ff122d245ba4',
            ],
            Y: [
              '0x264f79c4c25e276eef9cc7c1f9cc457bbd163da6622e035ce0d391a75bc7786d',
              '0x0bb467c57b59d07719ef8d750731b8804934c5719ecfb478bb2f1cd067de529e',
            ],
          },
          c: {
            X: '0x0a3ff2f80d5a3cdffc4d72b60adbe2ccc6b80019b7e385200c0a5e9767b3e55a',
            Y: '0x17df5f5581f5b2255aa8c4928a725d7bb4fde858fe20d9148eb68cd3ccf3404c',
          },
        },
        rootHash: '0x1887143e32deb497082f29e4a7acfd715b619df771f341c1d937be7ada9eeba0',
        serialNumbers: ['0x2fe08a3de311a172709a48e5f0b9e0952086cfaf3b5460802a4be860b85831aa'],
        sigHashes: ['0x0a42c0ea3dcf58568d8d7b28bf85378d5862907a2a3e6ea7493007e76c94778e'],
        sigPk: '0x000000000000000000000000dcbec38d4e54ae14211ddbee36ba0d6c79bf323e',
        publicAmount: '0x00000000000000000000000000000000000000000000000006f05b59d3b20000',
        relayerFeeAmount: '0x00000000000000000000000000000000000000000000000002c68af0bb140000',
        outCommitments: ['0x0c4aee1c78a12990316e050efdc1e3e15ff14dd74cec046507af7d91d4a0d9db'],
        outRollupFees: ['0x000000000000000000000000000000000000000000000000016345785d8a0000'],
        publicRecipient: '0x89b828e580d0A64d66a95F8d7655F509959915BC',
        relayerAddress: '0x90dacf39bb9bf2da9a94933868cb7936f4f08027',
        outEncryptedNotes: [
          '0xa9b9014dd62e0e322fc894dcb60918bd041ddb3ad9bf8654576d11a3eea7519f2c7fc0f75d092430b8ba9889d640b152f200c7d152c1afe04d8289d67e8719b83f5d776e64d0b9244c49f7663d82f2b33804c4ee98e0f88f13021d7cedc994bc059302779ea5aab7b4a808588b52597f6bfba91f0f251414459669a32f5782c3ab3b4fc0424b0cd5db0cc3ecd3597aafa4079abc3990e145542e445c3212f9db8139b0c0066cf93a50f2fd09cd113880bfb1b055058f9e1f706f02b3881d6d20c6a2938042cd518bc1cc79d7e201e93f1a',
        ],
        randomAuditingPublicKey:
          '8989360013687819029419192202478408963734381222022249519775940270276585213714',
        encryptedAuditorNotes: [
          '9304211544533419373233551512381865504930735952769539856689231218386508240695',
          '16664764115233469124130788233234927795103692211447786278768128411429138181594',
          '19702540005795390272614336787569914317423232129786054293604232025081288521904',
          '13327065876385551006505508995618286728301078778932608501010619435998437960942',
          '8076279151446424332011830464872610302102488290679346743542555799634896696058',
        ],
        signature:
          '0x17b1256809af40c4b6c2c7ed888d774194f722e46613cf26a53f247d5b22710e2dd9cc7328024d919d46ef96310c55eda966a2caab40624749f6e3ddceabb3591b',
        relayerContractAddress: '0xd3f481c84FeE6af4a068679Dc75e580acE9672c9',
        maxGasFee: 300000000000,
      },
      status: 'FAILED',
      response: null,
      error: {
        message: 'SendError',
      },
    },
    version: '0.0.9',
  };
}

function getMockBadRequest() {
  return {
    code: -1,
    data: undefined,
    message: 'failed reason',
    version: '0.0.9',
  };
}

describe('Test relayer client job status interface', () => {
  let relayer: Relayer;
  let mock: MockAdapter;

  beforeAll(async () => {
    relayer = new Relayer();
    await relayer.initialize({
      isTestnet: true,
      mystikoConfig: '../core/src/config/mystiko_config/config/testnet/config.json',
      relayerConfig: '../core/src/config/mystiko_relayer_config/config/testnet/config.json',
    });
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  it('should get job status throw exception', async () => {
    mock.onGet('http://127.0.0.1:8090/jobs/nPauONMKRRCFoLzTUZQ6rg-51').reply(200, getMockBadRequest());
    await expect(
      relayer.relayerHandler?.jobStatus({
        jobId: 'nPauONMKRRCFoLzTUZQ6rg-51',
        registerUrl: 'http://127.0.0.1:8090',
      }),
    ).rejects.toThrow(new RelayerError(-1, 'failed reason'));
  });

  it('should get job status(FAILED) successful', async () => {
    mock.onGet('http://127.0.0.1:8090/jobs/nPauONMKRRCFoLzTUZQ6rg-51').reply(200, getMockFailedResponse());
    const res = await relayer.relayerHandler?.jobStatus({
      jobId: 'nPauONMKRRCFoLzTUZQ6rg-51',
      registerUrl: 'http://127.0.0.1:8090',
    });
    expect(res).not.toBe(undefined);
    expect(res!.status).toEqual('FAILED');
  });

  it('should get job status(CONFIRMED) successful', () => {});
});
