import { Wallet } from '@ethersproject/wallet';
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
  MystikoV2WithLoopERC20,
  MystikoV2WithLoopMain,
  Rollup16Verifier,
  Rollup1Verifier,
  Rollup4Verifier,
  TestToken,
  WithdrawVerifier,
} from '../../typechain';
import { MerkleTreeHeight, RootHistoryLength, MinRollupFee } from '../util/constants';

const { waffle } = require('hardhat');

describe('Test Mystiko loop', () => {
  async function fixture(accounts: Wallet[]) {
    const { testToken, withdraw, rollup1, rollup4, rollup16 } = await deployDependContracts(accounts);
    const c1 = await deployLoopContracts(accounts, withdraw.address, testToken.address, {});
    const c2 = await deployLoopContracts(accounts, withdraw.address, testToken.address, { treeHeight: 1 });
    return { testToken, withdraw, rollup1, rollup4, rollup16, c1, c2 };
  }

  let accounts: Wallet[];
  let testToken: TestToken;
  let loopERC20: MystikoV2WithLoopERC20;
  let loopMain: MystikoV2WithLoopMain;
  let loopERC20Limit: MystikoV2WithLoopERC20;
  let loopMainLimit: MystikoV2WithLoopMain;
  let rollup1: Rollup1Verifier;
  let rollup4: Rollup4Verifier;
  let rollup16: Rollup16Verifier;
  let withdraw: WithdrawVerifier;

  beforeEach(async () => {
    accounts = waffle.provider.getWallets();

    const r = await loadFixture(fixture);
    testToken = r.testToken;
    loopERC20 = r.c1.loopERC20;
    loopMain = r.c1.loopMain;
    loopERC20Limit = r.c2.loopERC20;
    loopMainLimit = r.c2.loopMain;
    rollup1 = r.rollup1;
    rollup4 = r.rollup4;
    rollup16 = r.rollup16;
    withdraw = r.withdraw;
  });

  it('test constructor', () => {
    testConstructor(
      loopMain,
      withdraw,
      MerkleTreeHeight,
      RootHistoryLength,
      undefined,
      undefined,
      MinRollupFee,
    );
    testConstructor(
      loopERC20,
      withdraw,
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
    const cmInfo = await constructCommitment(21, depositAmount);

    await testLoopDeposit(loopMain, loopMainLimit, testToken, accounts, depositAmount, true, cmInfo);
    testRollup(loopMain, rollup16, testToken, accounts, cmInfo.commitments, { rollupSize: 16 });
    testRollup(loopMain, rollup4, testToken, accounts, cmInfo.commitments, { rollupSize: 4 });
    testRollup(loopMain, rollup1, testToken, accounts, cmInfo.commitments, { rollupSize: 1 });
  });

  it('test loop erc20 deposit with rollup', async () => {
    const depositAmount = toDecimals(100).toString();
    const cmInfo = await constructCommitment(21, depositAmount);

    await testLoopDeposit(loopERC20, loopERC20Limit, testToken, accounts, depositAmount, false, cmInfo);
    testRollup(loopERC20, rollup16, testToken, accounts, cmInfo.commitments, {
      isMainAsset: false,
      rollupSize: 16,
    });
    testRollup(loopERC20, rollup4, testToken, accounts, cmInfo.commitments, {
      isMainAsset: false,
      rollupSize: 4,
    });
    testRollup(loopERC20, rollup1, testToken, accounts, cmInfo.commitments, {
      isMainAsset: false,
      rollupSize: 1,
    });
  });
});
