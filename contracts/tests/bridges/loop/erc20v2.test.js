import { testConstructor, testAdminOperations, testDeposit, testRollup } from '../../common';
import { toDecimals } from '../../../../src/utils.js';

const MystikoContract = artifacts.require('MystikoV2WithLoopERC20');
const WithdrawVerifierContract = artifacts.require('WithdrawVerifier');
const TestTokenContract = artifacts.require('TestToken');
const Rollup4VerifierContract = artifacts.require('Rollup4Verifier');

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
  const rollupVerifierContractGetter = () => Rollup4VerifierContract.deployed();
  testConstructor(getContract, withdrawVerifierContractGetter, {
    minRollupFee: toDecimals(1).toString(),
  });
  testAdminOperations(getContract, accounts);
  testDeposit(getContract, accounts, {
    depositAmount: toDecimals(1).toString(),
    isMainAsset: false,
  });
  testRollup(getContract, rollupVerifierContractGetter, accounts, {
    rollupSize: 4,
  });
});
