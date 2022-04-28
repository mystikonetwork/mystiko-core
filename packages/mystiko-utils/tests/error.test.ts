import { ethers } from 'ethers';
import { errorMessage, EtherError } from '../src';

test('Test errorMessage', () => {
  expect(errorMessage(undefined)).toBe('');
  expect(errorMessage(null)).toBe('');
  expect(errorMessage(new Error(undefined))).toBe('Error');
  expect(errorMessage(new Error('test'))).toBe('test');
  const error = new Error('abc') as EtherError;
  error.code = 'test code';
  expect(errorMessage(error)).toBe('[test code] abc');
  error.reason = 'error reason';
  expect(errorMessage(error)).toBe('[test code] error reason');
  error.code = ethers.errors.CALL_EXCEPTION;
  error.reason = 'transaction failed';
  expect(errorMessage(error)).toBe('transaction failed, please check block explorer for more information');
  expect(errorMessage({ a: 1 })).toBe('{"a":1}');
  expect(errorMessage({ data: { message: 'abc' } })).toBe('abc');
  expect(errorMessage(1)).toBe('1');
  expect(errorMessage('abc')).toBe('abc');
  expect(errorMessage(String('abc'))).toBe('abc');
  error.message =
    'cannot estimate gas; transaction may fail or' +
    ' may require manual gas limit (error={"code":-32603,"message"' +
    ':"execution reverted: The note has been already spent","data":{"' +
    'originalError":{"code":3,"data":"0x08c379a0000000000000000000000000000000000000' +
    '0000000000000000000000000020000000000000000000000000000000000000000000000000000000' +
    '000000001f546865206e6f746520686173206265656e20616c7265616479207370656e7400","message"' +
    ':"execution reverted: The note has been already spent"}}}, method="estimateGas", ' +
    'transaction={"from":"0x9a45D8edf1E2C0fC08F2cC1f3D99EffbcCe82B76","to":"0x6A9EA7A2A67f99Bd68Dd5' +
    '35C7a7CF93e3a2554c8","data":"0x261e55cc255bb81533b8fa7f3e73906a45821a024f1e27bdf17d0205bcce123' +
    '0b1ca47a514380c8b382307ed1131b2a86ca0f02aca1db6c970bc285c56bd4edc0c6ed50b21d858ab5830a9d73461965' +
    'a2850443948657a507f99fe74cb8f09ad9324cc031d72d2c14ced7ff74a622877d229a26fc3dcb467ef9b36a323bcb1a9a' +
    'd9a09dd140f82bf8af6842150863201c5b067505700426d80e28e9d15e4a9e9f4ddb13827a1167b840f1e3afa22f60bc0109' +
    '34df871b97f84383a02dd27cd2bf0a010c71996390ce61ed76ee46348242b9f350570b955fd988b5ee6d96d11b25ad47e8' +
    '526c68c97fde10789fea23724a34a636e3e7366416cf17584f38ec561050683c60426f473b3360bff565b25d6e0f4' +
    '21f6bca45e5357122e28d816355ac970f69128d155f95a195c6ee61ff19a679d01ffebe03f6bcced12917498c9533f6205' +
    '060000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000009a45' +
    'd8edf1e2c0fc08f2cc1f3d99effbcce82b76","accessList":null}, code=UNPREDICTABLE_GAS_LIMIT, ' +
    'version=providers/5.5.3)';
  error.code = ethers.errors.UNPREDICTABLE_GAS_LIMIT;
  expect(errorMessage(error)).toBe('[UNPREDICTABLE_GAS_LIMIT] The note has been already spent');
  error.message = '\\"execution reverted: amount too few\\"';
  expect(errorMessage(error)).toBe('[UNPREDICTABLE_GAS_LIMIT] amount too few');
});
