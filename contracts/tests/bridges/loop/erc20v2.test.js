import { testConstructor, testAdminOperations, testDeposit } from '../../common/mystikov2.js';
import { toDecimals } from '../../../../src/utils.js';

const MystikoContract = artifacts.require('MystikoV2WithLoopERC20');
const WithdrawVerifierContract = artifacts.require('WithdrawVerifier');

contract('MystikoV2WithLoopERC20', (accounts) => {
  describe('Test common cases', () => {
    testConstructor({
      MystikoContract,
      WithdrawVerifierContract,
      minRollupFee: toDecimals(1).toString(),
    });
    testAdminOperations({ MystikoContract, accounts });
    testDeposit({
      MystikoContract,
      accounts,
      depositAmount: toDecimals(1).toString(),
      isMainAsset: false,
    });
  });
});
