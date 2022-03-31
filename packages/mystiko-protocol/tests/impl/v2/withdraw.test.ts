import { toBN, toDecimals, toHexNoPrefix } from '@mystikonetwork/utils';
import { zkVerify } from '../../../src/impl/v2/common';
import { zkProveWithdraw } from '../../../src/impl/v2/withdraw';
import { v1Protocol } from '../../../src';

test('test zkProveWithdraw', async () => {
  // eslint-disable-next-line global-require
  const { initialize } = require('zokrates-js/node');
  const zokrates = await initialize();
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
  const wasmFile = 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Withdraw.program.gz';
  const abiFile = 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Withdraw.abi.json';
  const zkeyFile = 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Withdraw.pkey.gz';
  const vkeyFile = 'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Withdraw.vkey.gz';
  const proof = await zkProveWithdraw(
    zokrates,
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
    abiFile,
    wasmFile,
    zkeyFile,
  );
  let result = await zkVerify(zokrates, proof, vkeyFile);
  expect(result).toBe(true);
  proof.inputs[3] = toBN(toHexNoPrefix('0x722122dF12D4e14e13Ac3b6895a86e84145b6967'), 16).toString();
  result = await zkVerify(zokrates, proof, vkeyFile);
  expect(result).toBe(false);
});
