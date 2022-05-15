import { MystikoProtocol, MystikoProtocolV2 } from '@mystikonetwork/protocol';
import { ZokratesCliProver } from '@mystikonetwork/zkp-node';

export function createProtocol(): MystikoProtocol {
  const prover = new ZokratesCliProver();
  return new MystikoProtocolV2(prover);
}
