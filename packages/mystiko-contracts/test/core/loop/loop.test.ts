import { Wallet } from '@ethersproject/wallet';
import {
  Hasher3,
  MystikoV2WithLoopERC20,
  MystikoV2WithLoopMain,
  CommitmentPoolMain,
  CommitmentPoolERC20,
} from '@mystikonetwork/contracts-abi';
import {
  deployLoopContracts,
  deployDependContracts,
  loadFixture,
  deployCommitmentPoolContracts,
} from '../../util/common';
import { testLoopConstructor, testLoopAdminOperations } from '../../common';
import { MinRollupFee } from '../../util/constants';

const { waffle } = require('hardhat');

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
    const pool = await deployCommitmentPoolContracts(accounts, testToken.address, {});
    const loop = await deployLoopContracts(
      accounts,
      hasher3.address,
      testToken.address,
      pool.poolMain,
      pool.poolERC20,
      {},
    );
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
      pool,
      loop,
    };
  }

  let accounts: Wallet[];
  let poolMain: CommitmentPoolMain;
  let poolErc20: CommitmentPoolERC20;
  let loopERC20: MystikoV2WithLoopERC20;
  let loopMain: MystikoV2WithLoopMain;
  let hasher3: Hasher3;

  beforeEach(async () => {
    accounts = waffle.provider.getWallets();

    const r = await loadFixture(fixture);
    poolMain = r.pool.poolMain;
    poolErc20 = r.pool.poolERC20;
    loopMain = r.loop.coreMain;
    loopERC20 = r.loop.coreERC20;
    hasher3 = r.hasher3;
  });

  it('test constructor', () => {
    testLoopConstructor('MystikoV2WithLoopMain', loopMain, hasher3, MinRollupFee, poolMain.address);
    testLoopConstructor('MystikoV2WithLoopERC20', loopERC20, hasher3, MinRollupFee, poolErc20.address);
  });

  it('test admin operation', () => {
    testLoopAdminOperations('MystikoV2WithLoopMain', loopMain, accounts);
    testLoopAdminOperations('MystikoV2WithLoopERC20', loopERC20, accounts);
  });

  // test loop erc20 and main deposit with commitment pool test at pool.test.ts

  // it('test loop main deposit', async () => {
  //   const depositAmount = toDecimals(10);
  //   const cmInfo = await constructCommitment(protocol, 21, depositAmount.toString());
  //
  //   await testLoopDeposit(
  //     'MystikoV2WithLoopMain',
  //     protocol,
  //     loopMain,
  //     poolMain,
  //     testToken,
  //     accounts,
  //     depositAmount.toString(),
  //     true,
  //     cmInfo,
  //   );
  // });

  // it('test loop erc20 deposit', async () => {
  //   const depositAmount = toDecimals(100);
  //   const cmInfo = await constructCommitment(protocol, 21, depositAmount.toString());
  //
  //   await testLoopDeposit(
  //     'MystikoV2WithLoopERC20',
  //     protocol,
  //     loopERC20,
  //     poolErc20,
  //     testToken,
  //     accounts,
  //     depositAmount.toString(),
  //     false,
  //     cmInfo,
  //   );
  // });
});
