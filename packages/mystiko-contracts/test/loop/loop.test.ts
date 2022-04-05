import { Wallet } from '@ethersproject/wallet';
import { ZokratesRuntime, MystikoProtocolV2, ZokratesCliRuntime } from '@mystikonetwork/protocol';
import { toDecimals } from '@mystikonetwork/utils';
import { deployLoopContracts, deployDependContracts, loadFixture } from '../util/common';
import {
  testConstructor,
  testAdminOperations,
  constructCommitment,
  testLoopDeposit,
  testRollup,
} from '../common';
import {
  Hasher3,
  MystikoV2WithLoopERC20,
  MystikoV2WithLoopMain,
  Transaction1x0Verifier,
  Transaction1x1Verifier,
  Transaction1x2Verifier,
  Transaction2x0Verifier,
  Transaction2x1Verifier,
  Transaction2x2Verifier,
  Rollup16Verifier,
  Rollup1Verifier,
  Rollup4Verifier,
  TestToken,
} from '../../typechain';
import { MerkleTreeHeight, RootHistoryLength, MinRollupFee } from '../util/constants';

const { waffle } = require('hardhat');
const { initialize } = require('zokrates-js/node');

describe('Test Mystiko loop', () => {
  async function fixture(accounts: Wallet[]) {
    const {
      testToken,
      hasher3,
      transaction1x0Verifier,
      transaction1x1Verifier,
      transaction1x2Verifier,
      transaction2x0Verifier,
      transaction2x1Verifier,
      transaction2x2Verifier,
      rollup1,
      rollup4,
      rollup16,
    } = await deployDependContracts(accounts);
    const c1 = await deployLoopContracts(accounts, hasher3.address, testToken.address, {});
    const c2 = await deployLoopContracts(accounts, hasher3.address, testToken.address, { treeHeight: 1 });
    return {
      testToken,
      hasher3,
      transaction1x0Verifier,
      transaction1x1Verifier,
      transaction1x2Verifier,
      transaction2x0Verifier,
      transaction2x1Verifier,
      transaction2x2Verifier,
      rollup1,
      rollup4,
      rollup16,
      c1,
      c2,
    };
  }

  let accounts: Wallet[];
  let testToken: TestToken;
  let loopERC20: MystikoV2WithLoopERC20;
  let loopMain: MystikoV2WithLoopMain;
  let loopERC20Limit: MystikoV2WithLoopERC20;
  let loopMainLimit: MystikoV2WithLoopMain;
  let hasher3: Hasher3;
  let transaction1x0Verifier: Transaction1x0Verifier;
  let transaction1x1Verifier: Transaction1x1Verifier;
  let transaction1x2Verifier: Transaction1x2Verifier;
  let transaction2x0Verifier: Transaction2x0Verifier;
  let transaction2x1Verifier: Transaction2x1Verifier;
  let transaction2x2Verifier: Transaction2x2Verifier;
  let rollup1: Rollup1Verifier;
  let rollup4: Rollup4Verifier;
  let rollup16: Rollup16Verifier;
  let zokratesRuntime: ZokratesRuntime;
  let protocol: MystikoProtocolV2;

  beforeEach(async () => {
    accounts = waffle.provider.getWallets();
    const zokrates = await initialize();
    zokratesRuntime = new ZokratesCliRuntime(zokrates);
    protocol = new MystikoProtocolV2(zokratesRuntime);

    const r = await loadFixture(fixture);
    testToken = r.testToken;
    loopERC20 = r.c1.loopERC20;
    loopMain = r.c1.loopMain;
    loopERC20Limit = r.c2.loopERC20;
    loopMainLimit = r.c2.loopMain;
    hasher3 = r.hasher3;
    transaction1x0Verifier = r.transaction1x0Verifier;
    transaction1x1Verifier = r.transaction1x1Verifier;
    transaction1x2Verifier = r.transaction1x2Verifier;
    transaction2x0Verifier = r.transaction2x0Verifier;
    transaction2x1Verifier = r.transaction2x1Verifier;
    transaction2x2Verifier = r.transaction2x2Verifier;
    rollup1 = r.rollup1;
    rollup4 = r.rollup4;
    rollup16 = r.rollup16;
  });

  it('test constructor', () => {
    testConstructor(
      loopMain,
      hasher3,
      MerkleTreeHeight,
      RootHistoryLength,
      undefined,
      undefined,
      MinRollupFee,
    );
    testConstructor(
      loopERC20,
      hasher3,
      MerkleTreeHeight,
      RootHistoryLength,
      undefined,
      undefined,
      MinRollupFee,
    );
  });

  it('test admin operation', () => {
    testAdminOperations(loopMain, accounts);
    testAdminOperations(loopERC20, accounts);
  });

  it('test loop main deposit with rollup', async () => {
    const depositAmount = toDecimals(10).toString();
    const cmInfo = await constructCommitment(protocol, 21, depositAmount);

    await testLoopDeposit(
      protocol,
      loopMain,
      loopMainLimit,
      testToken,
      accounts,
      depositAmount,
      true,
      cmInfo,
    );
    testRollup(protocol, loopMain, rollup16, testToken, accounts, cmInfo.commitments, { rollupSize: 16 });
    testRollup(protocol, loopMain, rollup4, testToken, accounts, cmInfo.commitments, { rollupSize: 4 });
    testRollup(protocol, loopMain, rollup1, testToken, accounts, cmInfo.commitments, { rollupSize: 1 });
  });

  it('test loop erc20 deposit with rollup', async () => {
    const depositAmount = toDecimals(100).toString();
    const cmInfo = await constructCommitment(protocol, 21, depositAmount);

    await testLoopDeposit(
      protocol,
      loopERC20,
      loopERC20Limit,
      testToken,
      accounts,
      depositAmount,
      false,
      cmInfo,
    );
    testRollup(protocol, loopERC20, rollup16, testToken, accounts, cmInfo.commitments, {
      isMainAsset: false,
      rollupSize: 16,
    });
    testRollup(protocol, loopERC20, rollup4, testToken, accounts, cmInfo.commitments, {
      isMainAsset: false,
      rollupSize: 4,
    });
    testRollup(protocol, loopERC20, rollup1, testToken, accounts, cmInfo.commitments, {
      isMainAsset: false,
      rollupSize: 1,
    });
  });
});
