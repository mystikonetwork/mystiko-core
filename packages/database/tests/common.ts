import { MystikoProtocol, MystikoProtocolV2 } from '@mystikonetwork/protocol';
import { ZokratesNodeProverFactory } from '@mystikonetwork/zkp-node';

export async function createProtocol(): Promise<MystikoProtocol> {
  const factory = new ZokratesNodeProverFactory();
  const prover = await factory.create();
  return new MystikoProtocolV2(prover);
}
