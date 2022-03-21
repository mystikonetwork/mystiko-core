import { toDecimals } from '@mystikonetwork/utils';
import { v1Protocol } from '../../../src';

test('test zkProveWithdraw', async () => {
  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const pkVerify = v1Protocol.publicKeyForVerification(rawSkVerify);
  const skVerify = v1Protocol.secretKeyForVerification(rawSkVerify);
  const skEnc = v1Protocol.secretKeyForEncryption(rawSkEnc);
  const pkEnc = v1Protocol.publicKeyForEncryption(rawSkEnc);
  const amount = toDecimals(100, 18);
  const commitment1 = await v1Protocol.commitment(pkVerify, pkEnc, amount);
  const commitment2 = await v1Protocol.commitment(pkVerify, pkEnc, amount);
  const treeLeaves = [commitment1.commitmentHash, commitment2.commitmentHash];
  const treeIndex = 1;
  const wasmFile = 'node_modules/@mystikonetwork/circuits/dist/circom/dev/Withdraw.wasm.gz';
  const zkeyFile = 'node_modules/@mystikonetwork/circuits/dist/circom/dev/Withdraw.zkey.gz';
  const vkeyFile = 'node_modules/@mystikonetwork/circuits/dist/circom/dev/Withdraw.vkey.json.gz';
  const { proof, publicSignals } = await v1Protocol.zkProveWithdraw(
    pkVerify,
    skVerify,
    pkEnc,
    skEnc,
    amount,
    '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
    commitment2.commitmentHash,
    commitment2.privateNote,
    treeLeaves,
    treeIndex,
    wasmFile,
    zkeyFile,
  );
  let result = await v1Protocol.zkVerify(proof, publicSignals, vkeyFile);
  expect(result).toBe(true);
  publicSignals[3] = '0x722122dF12D4e14e13Ac3b6895a86e84145b6967';
  result = await v1Protocol.zkVerify(proof, publicSignals, vkeyFile);
  expect(result).toBe(false);
});
