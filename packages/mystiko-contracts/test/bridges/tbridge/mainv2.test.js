require('dotenv').config({ path: '../../../.env' });
import { testConstructor, testAdminOperations, testBridgeDeposit, testRollup } from '../../common';
import { toDecimals } from '@mystiko/utils';

const MystikoSrcContract = artifacts.require('MystikoWithTBridgeMain');
const MystikoDstContract = artifacts.require('MystikoWithTBridgeMain');
const ProxyContract = artifacts.require('MystikoTBridgeProxy');

const WithdrawVerifierContract = artifacts.require('WithdrawVerifier');
const Rollup1VerifierContract = artifacts.require('Rollup1Verifier');
const Rollup4VerifierContract = artifacts.require('Rollup4Verifier');
const Rollup16VerifierContract = artifacts.require('Rollup16Verifier');

const DefaultSourceChainID = 1;
const DefaultDestinationChainID = 2;
const DefaultDepositAmount = toDecimals(0.04).toString();
const { MIN_BRIDGE_FEE, MIN_EXECUTOR_FEE, MIN_ROLLUP_FEE } = process.env;

let srcContract = undefined;
let dstContract = undefined;
let proxyContract = undefined;

async function getSrcContract(options = undefined) {
  if (options) {
    return MystikoSrcContract.new(
      proxyContract.address,
      DefaultDestinationChainID,
      options.treeHeight ? options.treeHeight : 20,
      options.rootHistoryLength ? options.rootHistoryLength : 30,
      options.minBridgeFee ? options.minBridgeFee : MIN_BRIDGE_FEE,
      options.minExecutorFee ? options.minExecutorFee : MIN_EXECUTOR_FEE,
      options.minRollupFee ? options.minRollupFee : MIN_ROLLUP_FEE,
      options.withdrawVerifier
        ? options.withdrawVerifier
        : (await WithdrawVerifierContract.deployed()).address,
    );
  } else {
    return srcContract;
  }
}

async function getDstContract(options = undefined) {
  if (options) {
    return MystikoSrcContract.new(
      proxyContract.address,
      DefaultSourceChainID,
      options.treeHeight ? options.treeHeight : 20,
      options.rootHistoryLength ? options.rootHistoryLength : 30,
      options.minBridgeFee ? options.minBridgeFee : MIN_BRIDGE_FEE,
      options.minExecutorFee ? options.minExecutorFee : MIN_EXECUTOR_FEE,
      options.minRollupFee ? options.minRollupFee : MIN_ROLLUP_FEE,
      options.withdrawVerifier
        ? options.withdrawVerifier
        : (await WithdrawVerifierContract.deployed()).address,
    );
  } else {
    return dstContract;
  }
}

async function getProxyContract(options = undefined) {
  return proxyContract;
}

async function deployContract() {
  proxyContract = await ProxyContract.new();
  let verifier = await WithdrawVerifierContract.deployed();

  srcContract = await MystikoSrcContract.new(
    proxyContract.address,
    DefaultDestinationChainID,
    20,
    30,
    MIN_BRIDGE_FEE,
    MIN_EXECUTOR_FEE,
    MIN_ROLLUP_FEE,
    verifier.address,
  );

  dstContract = await MystikoDstContract.new(
    proxyContract.address,
    DefaultSourceChainID,
    20,
    30,
    MIN_BRIDGE_FEE,
    MIN_EXECUTOR_FEE,
    MIN_ROLLUP_FEE,
    verifier.address,
  );

  await srcContract.setPeerContractAddress(dstContract.address);
  await dstContract.setPeerContractAddress(srcContract.address);
}

contract('MystikoWithTBridgeMain', (accounts) => {
  const withdrawVerifierContractGetter = () => WithdrawVerifierContract.deployed();
  const rollup1VerifierContractGetter = () => Rollup1VerifierContract.deployed();
  const rollup4VerifierContractGetter = () => Rollup4VerifierContract.deployed();
  const rollup16VerifierContractGetter = () => Rollup16VerifierContract.deployed();
  testConstructor(deployContract, getSrcContract, withdrawVerifierContractGetter, {
    minBridgeFee: MIN_BRIDGE_FEE,
    minExecutorFee: MIN_EXECUTOR_FEE,
    minRollupFee: MIN_ROLLUP_FEE,
  });
  testAdminOperations(getSrcContract, accounts);

  const depositContext = testBridgeDeposit(getSrcContract, getDstContract, getProxyContract, accounts, {
    depositAmount: DefaultDepositAmount,
    numOfCommitments: 21,
  });
  testRollup(getDstContract, rollup16VerifierContractGetter, accounts, {
    commitments: depositContext.commitments,
    isMainAsset: true,
    rollupFee: MIN_ROLLUP_FEE,
    rollupSize: 16,
  });
  testRollup(getDstContract, rollup4VerifierContractGetter, accounts, {
    commitments: depositContext.commitments,
    isMainAsset: true,
    rollupFee: MIN_ROLLUP_FEE,
    rollupSize: 4,
  });
  testRollup(getDstContract, rollup1VerifierContractGetter, accounts, {
    commitments: depositContext.commitments,
    isMainAsset: true,
    rollupFee: MIN_ROLLUP_FEE,
    rollupSize: 1,
  });
});
