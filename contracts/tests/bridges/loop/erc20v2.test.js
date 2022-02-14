import { testConstructor, testAdminOperations, testDeposit, testRollup } from '../../common';
import { toDecimals } from '../../../../src/utils.js';

const MystikoContract = artifacts.require('MystikoV2WithLoopERC20');
const WithdrawVerifierContract = artifacts.require('WithdrawVerifier');
const Rollup4VerifierContract = artifacts.require('Rollup4Verifier');

contract('MystikoV2WithLoopERC20', (accounts) => {
  const contractGetter = () => MystikoContract.deployed();
  const withdrawVerifierContractGetter = () => WithdrawVerifierContract.deployed();
  const rollupVerifierContractGetter = () => Rollup4VerifierContract.deployed();
  testConstructor(contractGetter, withdrawVerifierContractGetter, {
    minRollupFee: toDecimals(1).toString(),
  });
  testAdminOperations(contractGetter, accounts);
  testDeposit(contractGetter, accounts, {
    depositAmount: toDecimals(1).toString(),
    isMainAsset: false,
  });
  testRollup(contractGetter, rollupVerifierContractGetter, accounts, {
    rollupSize: 4,
  });
});
