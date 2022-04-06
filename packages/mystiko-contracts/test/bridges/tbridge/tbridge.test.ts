// import { Wallet } from '@ethersproject/wallet';
// import { toDecimals } from '@mystikonetwork/utils';
// import { deployDependContracts, loadFixture, deployTBridgeContracts } from '../../util/common';
// import { testConstructor, testAdminOperations, constructCommitment, testRollup } from '../../common';
// import {
//   MystikoTBridgeProxy,
//   MystikoWithTBridgeERC20,
//   MystikoWithTBridgeMain,
//   Rollup16Verifier,
//   Rollup1Verifier,
//   Rollup4Verifier,
//   TestToken,
//   WithdrawVerifier,
// } from '../../../typechain';
// // @ts-ignore
// import {
//   MerkleTreeHeight,
//   RootHistoryLength,
//   MinRollupFee,
//   MinBridgeFee,
//   MinExecutorFee,
// } from '../../util/constants';
// import { testBridgeDeposit } from '../../common/bridgeDepositTests';
//
// const { waffle } = require('hardhat');
//
// describe('Test Mystiko tbridge', () => {
//   async function fixture(accounts: Wallet[]) {
//     const { testToken, withdraw, rollup1, rollup4, rollup16 } = await deployDependContracts(accounts);
//     const c1 = await deployTBridgeContracts(accounts, withdraw.address, testToken.address, {});
//     return { testToken, withdraw, rollup1, rollup4, rollup16, c1 };
//   }
//
//   let accounts: Wallet[];
//   let testToken: TestToken;
//   let proxy: MystikoTBridgeProxy;
//   let localERC20: MystikoWithTBridgeERC20;
//   let localMain: MystikoWithTBridgeMain;
//   let remoteERC20: MystikoWithTBridgeERC20;
//   let remoteMain: MystikoWithTBridgeMain;
//   let rollup1: Rollup1Verifier;
//   let rollup4: Rollup4Verifier;
//   let rollup16: Rollup16Verifier;
//   let withdraw: WithdrawVerifier;
//
//   beforeEach(async () => {
//     accounts = waffle.provider.getWallets();
//
//     const r = await loadFixture(fixture);
//     testToken = r.testToken;
//     proxy = r.c1.proxy;
//     localERC20 = r.c1.localERC20;
//     localMain = r.c1.localMain;
//     remoteERC20 = r.c1.remoteERC20;
//     remoteMain = r.c1.remoteMain;
//     rollup1 = r.rollup1;
//     rollup4 = r.rollup4;
//     rollup16 = r.rollup16;
//     withdraw = r.withdraw;
//   });
//
//   it('test constructor', () => {
//     testConstructor(
//       localERC20,
//       withdraw,
//       MerkleTreeHeight,
//       RootHistoryLength,
//       MinBridgeFee,
//       MinExecutorFee,
//       MinRollupFee,
//     );
//     testConstructor(
//       localMain,
//       withdraw,
//       MerkleTreeHeight,
//       RootHistoryLength,
//       MinBridgeFee,
//       MinExecutorFee,
//       MinRollupFee,
//     );
//   });
//
//   it('test admin operation', () => {
//     testAdminOperations(localMain, accounts);
//     testAdminOperations(localERC20, accounts);
//   });
//
//   it('test bridge main to main deposit with rollup', async () => {
//     const depositAmount = toDecimals(10).toString();
//     const cmInfo = await constructCommitment(21, depositAmount);
//
//     await testBridgeDeposit(
//       localMain,
//       remoteMain,
//       proxy,
//       testToken,
//       accounts,
//       depositAmount,
//       true,
//       true,
//       cmInfo,
//     );
//     testRollup(remoteMain, rollup16, testToken, accounts, cmInfo.commitments, { rollupSize: 16 });
//     testRollup(remoteMain, rollup4, testToken, accounts, cmInfo.commitments, { rollupSize: 4 });
//     testRollup(remoteMain, rollup1, testToken, accounts, cmInfo.commitments, { rollupSize: 1 });
//   });
//
//   it('test bridge main to erc20 deposit with rollup', async () => {
//     const depositAmount = toDecimals(10).toString();
//     const cmInfo = await constructCommitment(21, depositAmount);
//
//     await testBridgeDeposit(
//       localMain,
//       remoteERC20,
//       proxy,
//       testToken,
//       accounts,
//       depositAmount,
//       true,
//       false,
//       cmInfo,
//     );
//     testRollup(remoteERC20, rollup16, testToken, accounts, cmInfo.commitments, {
//       isMainAsset: false,
//       rollupSize: 16,
//     });
//     testRollup(remoteERC20, rollup4, testToken, accounts, cmInfo.commitments, {
//       isMainAsset: false,
//       rollupSize: 4,
//     });
//     testRollup(remoteERC20, rollup1, testToken, accounts, cmInfo.commitments, {
//       isMainAsset: false,
//       rollupSize: 1,
//     });
//   });
//
//   it('test bridge erc20 to main deposit with rollup', async () => {
//     const depositAmount = toDecimals(10).toString();
//     const cmInfo = await constructCommitment(21, depositAmount);
//
//     await testBridgeDeposit(
//       localERC20,
//       remoteMain,
//       proxy,
//       testToken,
//       accounts,
//       depositAmount,
//       false,
//       true,
//       cmInfo,
//     );
//     testRollup(remoteMain, rollup16, testToken, accounts, cmInfo.commitments, { rollupSize: 16 });
//     testRollup(remoteMain, rollup4, testToken, accounts, cmInfo.commitments, { rollupSize: 4 });
//     testRollup(remoteMain, rollup1, testToken, accounts, cmInfo.commitments, { rollupSize: 1 });
//   });
//
//   it('test bridge erc20 to erc20 deposit with rollup', async () => {
//     const depositAmount = toDecimals(10).toString();
//     const cmInfo = await constructCommitment(21, depositAmount);
//
//     await testBridgeDeposit(
//       localERC20,
//       remoteERC20,
//       proxy,
//       testToken,
//       accounts,
//       depositAmount,
//       false,
//       false,
//       cmInfo,
//     );
//     testRollup(remoteERC20, rollup16, testToken, accounts, cmInfo.commitments, {
//       isMainAsset: false,
//       rollupSize: 16,
//     });
//     testRollup(remoteERC20, rollup4, testToken, accounts, cmInfo.commitments, {
//       isMainAsset: false,
//       rollupSize: 4,
//     });
//     testRollup(remoteERC20, rollup1, testToken, accounts, cmInfo.commitments, {
//       isMainAsset: false,
//       rollupSize: 1,
//     });
//   });
// });
