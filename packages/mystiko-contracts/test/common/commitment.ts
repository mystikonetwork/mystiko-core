import { MystikoProtocol } from '@mystikonetwork/protocol';
import { toBN } from '@mystikonetwork/utils';

export interface CommitmentInfo<C> {
  mystikoAddress: string;
  rawSkVerify: Buffer;
  rawSkEnc: Buffer;
  commitments: C[];
}

export async function constructCommitment<C>(
  protocol: MystikoProtocol<any, C>,
  size: number,
  depositAmount: string,
): Promise<CommitmentInfo<C>> {
  const rawSkVerify = protocol.randomBytes(protocol.verifySkSize);
  const rawSkEnc = protocol.randomBytes(protocol.encSkSize);
  const pkVerify = protocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = protocol.publicKeyForEncryption(rawSkEnc);
  const mystikoAddress = protocol.shieldedAddress(pkVerify, pkEnc);
  const commitments: any[] = [];
  for (let i = 0; i < 21; i += 1) {
    const commitment = await protocol.commitmentWithShieldedAddress(mystikoAddress, toBN(depositAmount));
    commitments.push(commitment);
  }

  return { mystikoAddress, rawSkVerify, rawSkEnc, commitments };
}
