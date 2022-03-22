require('dotenv').config({ path: '../../../.env' });
import { testConstructor, testAdminOperations, testBridgeDeposit, testRollup } from '../../common';
import { toDecimals } from '@mystikonetwork/utils';

const MystikoContractMain = artifacts.require('MystikoWithTBridgeMain');
const MystikoContractErc20 = artifacts.require('MystikoWithTBridgeERC20');
const TestTokenContract = artifacts.require('TestToken');
const ProxyContract = artifacts.require('MystikoTBridgeProxy');

const WithdrawVerifierContract = artifacts.require('WithdrawVerifier');
const Rollup1VerifierContract = artifacts.require('Rollup1Verifier');
const Rollup4VerifierContract = artifacts.require('Rollup4Verifier');
const Rollup16VerifierContract = artifacts.require('Rollup16Verifier');

const DefaultSourceChainID = 1001;
const DefaultDestinationChainID = 1002;
const DefaultDepositAmount = toDecimals(0.04).toString();
const { MIN_BRIDGE_FEE, MIN_EXECUTOR_FEE, MIN_ROLLUP_FEE } = process.env;

let srcMainAsset = undefined;
let dstMainAsset = undefined;
let srcContract = undefined;
let dstContract = undefined;
let proxyContract = undefined;

async function getContract(mainAsset, peerChainID, options = undefined) {
  if (mainAsset) {
    return MystikoContractMain.new(
      proxyContract.address,
      peerChainID,
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
    return MystikoContractErc20.new(
      proxyContract.address,
      peerChainID,
      options.treeHeight ? options.treeHeight : 20,
      options.rootHistoryLength ? options.rootHistoryLength : 30,
      options.minBridgeFee ? options.minBridgeFee : MIN_BRIDGE_FEE,
      options.minExecutorFee ? options.minExecutorFee : MIN_EXECUTOR_FEE,
      options.minRollupFee ? options.minRollupFee : MIN_ROLLUP_FEE,
      options.withdrawVerifier
        ? options.withdrawVerifier
        : (await WithdrawVerifierContract.deployed()).address,
      options.assetAddress ? options.assetAddress : (await TestTokenContract.deployed()).address,
    );
  }
}

function getSrcContract(options = undefined) {
  if (options) {
    return getContract(srcMainAsset, DefaultDestinationChainID, options);
  } else {
    return srcContract;
  }
}

function getDstContract(options = undefined) {
  if (options) {
    return getContract(dstMainAsset, DefaultSourceChainID, options);
  } else {
    return dstContract;
  }
}

function getProxyContract() {
  return proxyContract;
}

async function deployContract(mainAsset, peerChainID) {
  const verifier = await WithdrawVerifierContract.deployed();
  const token = await TestTokenContract.deployed();

  if (mainAsset) {
    return MystikoContractMain.new(
      proxyContract.address,
      peerChainID,
      20,
      30,
      MIN_BRIDGE_FEE,
      MIN_EXECUTOR_FEE,
      MIN_ROLLUP_FEE,
      verifier.address,
    );
  } else {
    return await MystikoContractErc20.new(
      proxyContract.address,
      peerChainID,
      20,
      30,
      MIN_BRIDGE_FEE,
      MIN_EXECUTOR_FEE,
      MIN_ROLLUP_FEE,
      verifier.address,
      token.address,
    );
  }
}

async function deployContractPair() {
  proxyContract = await ProxyContract.new();
  srcContract = await deployContract(srcMainAsset, DefaultDestinationChainID);
  dstContract = await deployContract(dstMainAsset, DefaultSourceChainID);

  await srcContract.setPeerContractAddress(dstContract.address);
  await dstContract.setPeerContractAddress(srcContract.address);
}

function testTokenPair(src, dst, accounts) {
  srcMainAsset = src;
  dstMainAsset = dst;

  const withdrawVerifierContractGetter = () => WithdrawVerifierContract.deployed();
  const rollup1VerifierContractGetter = () => Rollup1VerifierContract.deployed();
  const rollup4VerifierContractGetter = () => Rollup4VerifierContract.deployed();
  const rollup16VerifierContractGetter = () => Rollup16VerifierContract.deployed();
  testConstructor(deployContractPair, getSrcContract, withdrawVerifierContractGetter, {
    minBridgeFee: MIN_BRIDGE_FEE,
    minExecutorFee: MIN_EXECUTOR_FEE,
    minRollupFee: MIN_ROLLUP_FEE,
  });
  testAdminOperations(getSrcContract, accounts);

  const depositContext = testBridgeDeposit(getSrcContract, getDstContract, getProxyContract, accounts, {
    isSrcMainAsset: srcMainAsset,
    isDstMainAsset: dstMainAsset,
    depositAmount: DefaultDepositAmount,
    numOfCommitments: 21,
  });
  testRollup(getDstContract, rollup16VerifierContractGetter, accounts, {
    commitments: depositContext.commitments,
    isMainAsset: dstMainAsset,
    rollupFee: MIN_ROLLUP_FEE,
    rollupSize: 16,
  });
  testRollup(getDstContract, rollup4VerifierContractGetter, accounts, {
    commitments: depositContext.commitments,
    isMainAsset: dstMainAsset,
    rollupFee: MIN_ROLLUP_FEE,
    rollupSize: 4,
  });
  testRollup(getDstContract, rollup1VerifierContractGetter, accounts, {
    commitments: depositContext.commitments,
    isMainAsset: dstMainAsset,
    rollupFee: MIN_ROLLUP_FEE,
    rollupSize: 1,
  });
}

contract('MystikoWithTBridgeERC20ToMain', (accounts) => {
  testTokenPair(false, true, accounts);
});
