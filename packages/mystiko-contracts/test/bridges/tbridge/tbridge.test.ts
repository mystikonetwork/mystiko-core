import { Wallet } from '@ethersproject/wallet';
import { ZokratesRuntime, MystikoProtocolV2, ZokratesCliRuntime } from '@mystikonetwork/protocol';
import { toBN, toDecimals } from '@mystikonetwork/utils';
import { deployDependContracts, loadFixture, deployTBridgeContracts } from '../../util/common';
import {
  testConstructor,
  testAdminOperations,
  constructCommitment,
  testRollup,
  testTransact,
} from '../../common';
import {
  Hasher3,
  MystikoTBridgeProxy,
  MystikoWithTBridgeERC20,
  MystikoWithTBridgeMain,
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
} from '../../../typechain';
// @ts-ignore
import {
  MerkleTreeHeight,
  RootHistoryLength,
  MinRollupFee,
  MinBridgeFee,
  MinExecutorFee,
} from '../../util/constants';
import { testBridgeDeposit } from '../../common/bridgeDepositTests';

const { waffle } = require('hardhat');
const { initialize } = require('zokrates-js/node');

describe('Test Mystiko tbridge', () => {
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
    const c1 = await deployTBridgeContracts(accounts, hasher3.address, testToken.address, {});
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
    };
  }

  let accounts: Wallet[];
  let testToken: TestToken;
  let proxy: MystikoTBridgeProxy;
  let localERC20: MystikoWithTBridgeERC20;
  let localMain: MystikoWithTBridgeMain;
  let remoteERC20: MystikoWithTBridgeERC20;
  let remoteMain: MystikoWithTBridgeMain;
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
    proxy = r.c1.proxy;
    localERC20 = r.c1.localERC20;
    localMain = r.c1.localMain;
    remoteERC20 = r.c1.remoteERC20;
    remoteMain = r.c1.remoteMain;
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
      'MystikoWithTBridgeERC20',
      localERC20,
      hasher3,
      MerkleTreeHeight,
      RootHistoryLength,
      MinBridgeFee,
      MinExecutorFee,
      MinRollupFee,
    );
    testConstructor(
      'MystikoWithTBridgeMain',
      localMain,
      hasher3,
      MerkleTreeHeight,
      RootHistoryLength,
      MinBridgeFee,
      MinExecutorFee,
      MinRollupFee,
    );
  });

  it('test admin operation', () => {
    testAdminOperations('MystikoWithTBridgeMain', localMain, accounts);
    testAdminOperations('MystikoWithTBridgeERC20', localERC20, accounts);
  });

  it('test bridge main to main deposit with rollup', async () => {
    const depositAmount = toDecimals(10);
    const cmInfo = await constructCommitment(protocol, 21, depositAmount.toString());

    await testBridgeDeposit(
      'MystikoWithTBridgeMain',
      protocol,
      localMain,
      remoteMain,
      proxy,
      testToken,
      accounts,
      depositAmount.toString(),
      true,
      true,
      cmInfo,
    );
    testRollup(
      'MystikoWithTBridgeMain',
      protocol,
      remoteMain,
      rollup16,
      testToken,
      accounts,
      cmInfo.commitments,
      { rollupSize: 16 },
    );
    testRollup(
      'MystikoWithTBridgeMain',
      protocol,
      remoteMain,
      rollup4,
      testToken,
      accounts,
      cmInfo.commitments,
      { rollupSize: 4 },
    );
    testRollup(
      'MystikoWithTBridgeMain',
      protocol,
      remoteMain,
      rollup1,
      testToken,
      accounts,
      cmInfo.commitments,
      { rollupSize: 1 },
    );

    testTransact(
      'MystikoWithTBridgeMain',
      protocol,
      remoteMain,
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
      undefined,
      false,
    );

    testTransact(
      'MystikoWithTBridgeMain',
      protocol,
      remoteMain,
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
      undefined,
      false,
    );

    testTransact(
      'MystikoWithTBridgeMain',
      protocol,
      remoteMain,
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
      undefined,
      false,
    );

    testTransact(
      'MystikoWithTBridgeMain',
      protocol,
      remoteMain,
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
      undefined,
      false,
    );

    testTransact(
      'MystikoWithTBridgeMain',
      protocol,
      remoteMain,
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
      undefined,
      false,
    );

    testTransact(
      'MystikoWithTBridgeMain',
      protocol,
      remoteMain,
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
      undefined,
      false,
    );
  });

  it('test bridge main to erc20 deposit with rollup', async () => {
    const depositAmount = toDecimals(10);
    const cmInfo = await constructCommitment(protocol, 21, depositAmount.toString());

    await testBridgeDeposit(
      'MystikoWithTBridgeMain',
      protocol,
      localMain,
      remoteERC20,
      proxy,
      testToken,
      accounts,
      depositAmount.toString(),
      true,
      false,
      cmInfo,
    );
    testRollup(
      'MystikoWithTBridgeMain',
      protocol,
      remoteERC20,
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
      'MystikoWithTBridgeMain',
      protocol,
      remoteERC20,
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
      'MystikoWithTBridgeMain',
      protocol,
      remoteERC20,
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
      'MystikoWithTBridgeMain',
      protocol,
      remoteERC20,
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
      false,
    );

    testTransact(
      'MystikoWithTBridgeMain',
      protocol,
      remoteERC20,
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
      false,
    );

    testTransact(
      'MystikoWithTBridgeMain',
      protocol,
      remoteERC20,
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
      false,
    );

    testTransact(
      'MystikoWithTBridgeMain',
      protocol,
      remoteERC20,
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
      false,
    );

    testTransact(
      'MystikoWithTBridgeMain',
      protocol,
      remoteERC20,
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
      false,
    );

    testTransact(
      'MystikoWithTBridgeMain',
      protocol,
      remoteERC20,
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
      false,
    );
  });

  it('test bridge erc20 to main deposit with rollup', async () => {
    const depositAmount = toDecimals(10);
    const cmInfo = await constructCommitment(protocol, 21, depositAmount.toString());

    await testBridgeDeposit(
      'MystikoWithTBridgeERC20',
      protocol,
      localERC20,
      remoteMain,
      proxy,
      testToken,
      accounts,
      depositAmount.toString(),
      false,
      true,
      cmInfo,
    );
    testRollup(
      'MystikoWithTBridgeERC20',
      protocol,
      remoteMain,
      rollup16,
      testToken,
      accounts,
      cmInfo.commitments,
      { rollupSize: 16 },
    );
    testRollup(
      'MystikoWithTBridgeERC20',
      protocol,
      remoteMain,
      rollup4,
      testToken,
      accounts,
      cmInfo.commitments,
      { rollupSize: 4 },
    );
    testRollup(
      'MystikoWithTBridgeERC20',
      protocol,
      remoteMain,
      rollup1,
      testToken,
      accounts,
      cmInfo.commitments,
      { rollupSize: 1 },
    );
  });

  it('test bridge erc20 to erc20 deposit with rollup', async () => {
    const depositAmount = toDecimals(10);
    const cmInfo = await constructCommitment(protocol, 21, depositAmount.toString());

    await testBridgeDeposit(
      'MystikoWithTBridgeERC20',
      protocol,
      localERC20,
      remoteERC20,
      proxy,
      testToken,
      accounts,
      depositAmount.toString(),
      false,
      false,
      cmInfo,
    );
    testRollup(
      'MystikoWithTBridgeERC20',
      protocol,
      remoteERC20,
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
      'MystikoWithTBridgeERC20',
      protocol,
      remoteERC20,
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
      'MystikoWithTBridgeERC20',
      protocol,
      remoteERC20,
      rollup1,
      testToken,
      accounts,
      cmInfo.commitments,
      {
        isMainAsset: false,
        rollupSize: 1,
      },
    );
  });
});
