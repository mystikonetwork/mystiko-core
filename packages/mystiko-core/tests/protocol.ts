import { MystikoProtocolV2, ZokratesWasmRuntime } from '@mystikonetwork/protocol';

export async function createProtocolV2(): Promise<MystikoProtocolV2> {
  // eslint-disable-next-line global-require
  const { initialize } = require('zokrates-js/node');
  const zokrates = await initialize();
  const runtime = new ZokratesWasmRuntime(zokrates);
  return Promise.resolve(new MystikoProtocolV2(runtime));
}
