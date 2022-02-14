import { testConstructor, testAdminOperations, testDeposit, testRollup } from '../../common';
import { toDecimals } from '../../../../src/utils.js';

const MystikoContract = artifacts.require('MystikoV2WithLoopMain');
const WithdrawVerifierContract = artifacts.require('WithdrawVerifier');
const Rollup16VerifierContract = artifacts.require('Rollup16Verifier');

contract('MystikoV2WithLoopMain', (accounts) => {
  const contractGetter = () => MystikoContract.deployed();
  const withdrawVerifierContractGetter = () => WithdrawVerifierContract.deployed();
  const rollupVerifierContractGetter = () => Rollup16VerifierContract.deployed();
  testConstructor(contractGetter, withdrawVerifierContractGetter, {
    minRollupFee: toDecimals(0.001).toString(),
  });
  testAdminOperations(contractGetter, accounts);
  testDeposit(contractGetter, accounts, {
    depositAmount: toDecimals(0.001).toString(),
    numOfCommitments: 16,
  });
  testRollup(contractGetter, rollupVerifierContractGetter, accounts, {
    rollupSize: 16,
  });
});
