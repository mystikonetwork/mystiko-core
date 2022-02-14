import { testConstructor, testAdminOperations, testDeposit, testRollup } from '../../common';
import { toDecimals } from '../../../../src/utils.js';

const MystikoContract = artifacts.require('MystikoV2WithLoopMain');
const WithdrawVerifierContract = artifacts.require('WithdrawVerifier');
const Rollup16VerifierContract = artifacts.require('Rollup16Verifier');

async function getContract(options = undefined) {
  if (options) {
    return MystikoContract.new(
      options.treeHeight ? options.treeHeight : 20,
      options.rootHistoryLength ? options.rootHistoryLength : 30,
      options.minRollupFee ? options.minRollupFee : '1000000000000000',
      options.withdrawVerifier
        ? options.withdrawVerifier
        : (await WithdrawVerifierContract.deployed()).address,
    );
  } else {
    return MystikoContract.deployed();
  }
}

contract('MystikoV2WithLoopMain', (accounts) => {
  const withdrawVerifierContractGetter = () => WithdrawVerifierContract.deployed();
  const rollupVerifierContractGetter = () => Rollup16VerifierContract.deployed();
  testConstructor(getContract, withdrawVerifierContractGetter, {
    minRollupFee: toDecimals(0.001).toString(),
  });
  testAdminOperations(getContract, accounts);
  testDeposit(getContract, accounts, {
    depositAmount: toDecimals(0.001).toString(),
    numOfCommitments: 16,
  });
  testRollup(getContract, rollupVerifierContractGetter, accounts, {
    rollupSize: 16,
  });
});
