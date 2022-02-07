import { testConstructor } from '../../common/mystikov2.js';

const MystikoContract = artifacts.require('MystikoV2WithLoopMain');
const WithdrawVerifierContract = artifacts.require('WithdrawVerifier');

contract('MystikoV2WithLoopMain', () => {
  describe('Test common cases', () => {
    testConstructor({
      MystikoContract,
      WithdrawVerifierContract,
      minRollupFee: '1000000000000000',
    });
  });
});
