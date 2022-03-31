import { Proof, VerificationKey, ZoKratesProvider } from 'zokrates-js';
import { logger, readJsonFile } from '@mystikonetwork/utils';

// eslint-disable-next-line import/prefer-default-export
export async function zkVerify(
  zokrates: ZoKratesProvider,
  proof: Proof,
  verifyKeyFile: string,
): Promise<boolean> {
  const vkey: VerificationKey = (await readJsonFile(verifyKeyFile)) as VerificationKey;
  logger.debug('start verifying generated proofs...');
  const result = zokrates.verify(vkey, proof);
  logger.debug(`proof verification is done, result=${result}`);
  return Promise.resolve(result);
}
