require('dotenv').config({ path: '../../.env' });
import { testConstructor, testAdminOperations, testLoopDeposit, testRollup } from '../common';
import { toDecimals } from '@mystiko/utils';

const MystikoContract = artifacts.require('MystikoV2WithLoopMain');
const WithdrawVerifierContract = artifacts.require('WithdrawVerifier');
const Rollup1VerifierContract = artifacts.require('Rollup1Verifier');
const Rollup4VerifierContract = artifacts.require('Rollup4Verifier');
const Rollup16VerifierContract = artifacts.require('Rollup16Verifier');

const DefaultDepositAmount = toDecimals(0.04).toString();
const { MIN_ROLLUP_FEE } = process.env;

async function getContract(options = undefined) {
  if (options) {
    return MystikoContract.new(
      options.treeHeight ? options.treeHeight : 20,
      options.rootHistoryLength ? options.rootHistoryLength : 30,
      options.minRollupFee ? options.minRollupFee : MIN_ROLLUP_FEE,
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
  const rollup1VerifierContractGetter = () => Rollup1VerifierContract.deployed();
  const rollup4VerifierContractGetter = () => Rollup4VerifierContract.deployed();
  const rollup16VerifierContractGetter = () => Rollup16VerifierContract.deployed();
  testConstructor(getContract, getContract, withdrawVerifierContractGetter, {
    minRollupFee: MIN_ROLLUP_FEE,
  });
  testAdminOperations(getContract, accounts);
  const depositContext = testLoopDeposit(getContract, accounts, {
    depositAmount: DefaultDepositAmount,
    numOfCommitments: 21,
  });
  testRollup(getContract, rollup16VerifierContractGetter, accounts, {
    commitments: depositContext.commitments,
    isMainAsset: true,
    rollupFee: MIN_ROLLUP_FEE,
    rollupSize: 16,
  });
  testRollup(getContract, rollup4VerifierContractGetter, accounts, {
    commitments: depositContext.commitments,
    isMainAsset: true,
    rollupFee: MIN_ROLLUP_FEE,
    rollupSize: 4,
  });
  testRollup(getContract, rollup1VerifierContractGetter, accounts, {
    commitments: depositContext.commitments,
    isMainAsset: true,
    rollupFee: MIN_ROLLUP_FEE,
    rollupSize: 1,
  });
});
