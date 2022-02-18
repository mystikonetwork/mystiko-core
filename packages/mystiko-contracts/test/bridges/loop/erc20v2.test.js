import { testConstructor, testAdminOperations, testDeposit, testRollup } from '../../common';
import { toDecimals } from '@mystiko/client/src/utils.js';

const MystikoContract = artifacts.require('MystikoV2WithLoopERC20');
const WithdrawVerifierContract = artifacts.require('WithdrawVerifier');
const TestTokenContract = artifacts.require('TestToken');
const Rollup1VerifierContract = artifacts.require('Rollup1Verifier');
const Rollup4VerifierContract = artifacts.require('Rollup4Verifier');
const Rollup16VerifierContract = artifacts.require('Rollup16Verifier');

async function getContract(options = undefined) {
  if (options) {
    return MystikoContract.new(
      options.treeHeight ? options.treeHeight : 20,
      options.rootHistoryLength ? options.rootHistoryLength : 30,
      options.minRollupFee ? options.minRollupFee : '1000000000000000000',
      options.withdrawVerifier
        ? options.withdrawVerifier
        : (await WithdrawVerifierContract.deployed()).address,
      options.assetAddress ? options.assetAddress : (await TestTokenContract.deployed()).address,
    );
  } else {
    return MystikoContract.deployed();
  }
}

contract('MystikoV2WithLoopERC20', (accounts) => {
  const withdrawVerifierContractGetter = () => WithdrawVerifierContract.deployed();
  const rollup1VerifierContractGetter = () => Rollup1VerifierContract.deployed();
  const rollup4VerifierContractGetter = () => Rollup4VerifierContract.deployed();
  const rollup16VerifierContractGetter = () => Rollup16VerifierContract.deployed();
  testConstructor(getContract, withdrawVerifierContractGetter, {
    minRollupFee: toDecimals(1).toString(),
  });
  testAdminOperations(getContract, accounts);
  const depositContext = testDeposit(getContract, accounts, {
    depositAmount: toDecimals(1).toString(),
    isMainAsset: false,
    numOfCommitments: 21,
  });
  testRollup(getContract, rollup16VerifierContractGetter, accounts, {
    commitments: depositContext.commitments,
    rollupSize: 16,
  });
  testRollup(getContract, rollup4VerifierContractGetter, accounts, {
    commitments: depositContext.commitments,
    rollupSize: 4,
  });
  testRollup(getContract, rollup1VerifierContractGetter, accounts, {
    commitments: depositContext.commitments,
    rollupSize: 1,
  });
});
