import { testConstructor, testAdminOperations, testDeposit } from '../../common/mystikov2.js';
import { toDecimals } from '../../../../src/utils.js';

const MystikoContract = artifacts.require('MystikoV2WithLoopMain');
const WithdrawVerifierContract = artifacts.require('WithdrawVerifier');

contract('MystikoV2WithLoopMain', (accounts) => {
  describe('Test common cases', () => {
    testConstructor({
      MystikoContract,
      WithdrawVerifierContract,
      minRollupFee: toDecimals(0.001).toString(),
    });
    testAdminOperations({ MystikoContract, accounts });
    testDeposit({
      MystikoContract,
      accounts,
      depositAmount: toDecimals(0.001).toString(),
    });
  });
});
