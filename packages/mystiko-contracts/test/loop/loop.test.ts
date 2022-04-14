import { Wallet } from '@ethersproject/wallet';
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
} from '@mystikonetwork/contracts-abi';
import { ZokratesRuntime, MystikoProtocolV2, ZokratesCliRuntime } from '@mystikonetwork/protocol';
import { toBN, toDecimals } from '@mystikonetwork/utils';
import { deployLoopContracts, deployDependContracts, loadFixture } from '../util/common';
import {
  testConstructor,
  testAdminOperations,
  constructCommitment,
  testLoopDeposit,
  testRollup,
  testTransact,
} from '../common';
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
      'MystikoV2WithLoopMain',
      loopMain,
      hasher3,
      MerkleTreeHeight,
      RootHistoryLength,
      undefined,
      undefined,
      MinRollupFee,
    );
    testConstructor(
      'MystikoV2WithLoopERC20',
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
    testAdminOperations('MystikoV2WithLoopMain', loopMain, accounts);
    testAdminOperations('MystikoV2WithLoopERC20', loopERC20, accounts);
  });

  it('test loop main deposit with rollup', async () => {
    const depositAmount = toDecimals(10);
    const cmInfo = await constructCommitment(protocol, 21, depositAmount.toString());

    await testLoopDeposit(
      'MystikoV2WithLoopMain',
      protocol,
      loopMain,
      loopMainLimit,
      testToken,
      accounts,
      depositAmount.toString(),
      true,
      cmInfo,
    );
    testRollup(
      'MystikoV2WithLoopMain',
      protocol,
      loopMain,
      rollup16,
      testToken,
      accounts,
      cmInfo.commitments,
      { rollupSize: 16 },
    );
    testRollup(
      'MystikoV2WithLoopMain',
      protocol,
      loopMain,
      rollup4,
      testToken,
      accounts,
      cmInfo.commitments,
      { rollupSize: 4 },
    );
    testRollup(
      'MystikoV2WithLoopMain',
      protocol,
      loopMain,
      rollup1,
      testToken,
      accounts,
      cmInfo.commitments,
      { rollupSize: 1 },
    );

    testTransact(
      'MystikoV2WithLoopMain',
      protocol,
      loopMain,
      transaction1x0Verifier,
      cmInfo,
      [0],
      depositAmount,
      toBN(0),
      [],
      [],
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x0.program.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x0.abi.json',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x0.pkey.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x0.vkey.gz',
    );

    testTransact(
      'MystikoV2WithLoopMain',
      protocol,
      loopMain,
      transaction1x1Verifier,
      cmInfo,
      [1],
      depositAmount.sub(toDecimals(3)),
      toDecimals(1),
      [toDecimals(1)],
      [toDecimals(1)],
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x1.program.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x1.abi.json',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x1.pkey.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x1.vkey.gz',
    );

    testTransact(
      'MystikoV2WithLoopMain',
      protocol,
      loopMain,
      transaction1x2Verifier,
      cmInfo,
      [2],
      depositAmount.sub(toDecimals(5)),
      toDecimals(1),
      [toDecimals(1), toDecimals(1)],
      [toDecimals(1), toDecimals(1)],
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x2.program.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x2.abi.json',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x2.pkey.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x2.vkey.gz',
    );

    testTransact(
      'MystikoV2WithLoopMain',
      protocol,
      loopMain,
      transaction2x0Verifier,
      cmInfo,
      [3, 4],
      depositAmount.add(depositAmount).sub(toDecimals(1)),
      toDecimals(1),
      [],
      [],
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x0.program.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x0.abi.json',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x0.pkey.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x0.vkey.gz',
    );

    testTransact(
      'MystikoV2WithLoopMain',
      protocol,
      loopMain,
      transaction2x1Verifier,
      cmInfo,
      [5, 6],
      depositAmount.add(depositAmount).sub(toDecimals(3)),
      toDecimals(1),
      [toDecimals(1)],
      [toDecimals(1)],
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x1.program.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x1.abi.json',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x1.pkey.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x1.vkey.gz',
    );

    testTransact(
      'MystikoV2WithLoopMain',
      protocol,
      loopMain,
      transaction2x2Verifier,
      cmInfo,
      [7, 8],
      depositAmount.add(depositAmount).sub(toDecimals(5)),
      toDecimals(1),
      [toDecimals(1), toDecimals(1)],
      [toDecimals(1), toDecimals(1)],
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x2.program.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x2.abi.json',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x2.pkey.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x2.vkey.gz',
    );
  });

  it('test loop erc20 deposit with rollup', async () => {
    const depositAmount = toDecimals(100);
    const cmInfo = await constructCommitment(protocol, 21, depositAmount.toString());

    await testLoopDeposit(
      'MystikoV2WithLoopERC20',
      protocol,
      loopERC20,
      loopERC20Limit,
      testToken,
      accounts,
      depositAmount.toString(),
      false,
      cmInfo,
    );
    testRollup(
      'MystikoV2WithLoopERC20',
      protocol,
      loopERC20,
      rollup16,
      testToken,
      accounts,
      cmInfo.commitments,
      {
        isMainAsset: false,
        rollupSize: 16,
      },
    );
    testRollup(
      'MystikoV2WithLoopERC20',
      protocol,
      loopERC20,
      rollup4,
      testToken,
      accounts,
      cmInfo.commitments,
      {
        isMainAsset: false,
        rollupSize: 4,
      },
    );
    testRollup(
      'MystikoV2WithLoopERC20',
      protocol,
      loopERC20,
      rollup1,
      testToken,
      accounts,
      cmInfo.commitments,
      {
        isMainAsset: false,
        rollupSize: 1,
      },
    );

    testTransact(
      'MystikoV2WithLoopERC20',
      protocol,
      loopERC20,
      transaction1x0Verifier,
      cmInfo,
      [0],
      depositAmount,
      toBN(0),
      [],
      [],
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x0.program.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x0.abi.json',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x0.pkey.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x0.vkey.gz',
      testToken,
    );

    testTransact(
      'MystikoV2WithLoopERC20',
      protocol,
      loopERC20,
      transaction1x1Verifier,
      cmInfo,
      [1],
      depositAmount.sub(toDecimals(3)),
      toDecimals(1),
      [toDecimals(1)],
      [toDecimals(1)],
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x1.program.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x1.abi.json',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x1.pkey.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x1.vkey.gz',
      testToken,
    );

    testTransact(
      'MystikoV2WithLoopERC20',
      protocol,
      loopERC20,
      transaction1x2Verifier,
      cmInfo,
      [2],
      depositAmount.sub(toDecimals(5)),
      toDecimals(1),
      [toDecimals(1), toDecimals(1)],
      [toDecimals(1), toDecimals(1)],
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x2.program.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x2.abi.json',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x2.pkey.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction1x2.vkey.gz',
      testToken,
    );

    testTransact(
      'MystikoV2WithLoopERC20',
      protocol,
      loopERC20,
      transaction2x0Verifier,
      cmInfo,
      [3, 4],
      depositAmount.add(depositAmount).sub(toDecimals(1)),
      toDecimals(1),
      [],
      [],
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x0.program.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x0.abi.json',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x0.pkey.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x0.vkey.gz',
      testToken,
    );

    testTransact(
      'MystikoV2WithLoopERC20',
      protocol,
      loopERC20,
      transaction2x1Verifier,
      cmInfo,
      [5, 6],
      depositAmount.add(depositAmount).sub(toDecimals(3)),
      toDecimals(1),
      [toDecimals(1)],
      [toDecimals(1)],
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x1.program.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x1.abi.json',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x1.pkey.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x1.vkey.gz',
      testToken,
    );

    testTransact(
      'MystikoV2WithLoopERC20',
      protocol,
      loopERC20,
      transaction2x2Verifier,
      cmInfo,
      [7, 8],
      depositAmount.add(depositAmount).sub(toDecimals(5)),
      toDecimals(1),
      [toDecimals(1), toDecimals(1)],
      [toDecimals(1), toDecimals(1)],
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x2.program.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x2.abi.json',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x2.pkey.gz',
      'node_modules/@mystikonetwork/circuits/dist/zokrates/dev/Transaction2x2.vkey.gz',
      testToken,
    );
  });
});
