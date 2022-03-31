import { v1Protocol } from '@mystikonetwork/protocol';
import { toBN } from '@mystikonetwork/utils';

export interface CommitmentInfo {
  mystikoAddress: string;
  commitments: any[];
}

export async function constructCommitment(size: number, depositAmount: string): Promise<CommitmentInfo> {
  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const pkVerify = v1Protocol.publicKeyForVerification(rawSkVerify);
  // const skVerify = v1Protocol.secretKeyForVerification(rawSkVerify);
  const pkEnc = v1Protocol.publicKeyForEncryption(rawSkEnc);
  // const skEnc = v1Protocol.secretKeyForEncryption(rawSkEnc);
  const mystikoAddress = v1Protocol.shieldedAddress(pkVerify, pkEnc);
  const commitments: any[] = [];
  for (let i = 0; i < 21; i += 1) {
    const commitment = await v1Protocol.commitmentWithShieldedAddress(mystikoAddress, toBN(depositAmount));
    commitments.push(commitment);
  }

  return { mystikoAddress, commitments };
}
