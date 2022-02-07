import { testConstructor, testAdminOperations, testDeposit, testRollup } from '../../common/mystikov2.js';
import { toDecimals } from '../../../../src/utils.js';

const MystikoContract = artifacts.require('MystikoV2WithLoopMain');
const WithdrawVerifierContract = artifacts.require('WithdrawVerifier');
const Rollup16VerifierContract = artifacts.require('Rollup16Verifier');

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
      numOfCommitments: 16,
    });
    testRollup({
      MystikoContract,
      RollupVerifierContract: Rollup16VerifierContract,
      accounts,
      rollupSize: 16,
    });
  });
});
