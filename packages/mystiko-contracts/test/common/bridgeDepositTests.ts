// import { MystikoProtocolV1 } from '@mystikonetwork/protocol';
// import { toHex, toBN } from '@mystikonetwork/utils';
// import { Wallet } from '@ethersproject/wallet';
// import { TestToken } from '../../typechain';
// import { CommitmentInfo } from './commitment';
// import { BridgeAccountIndex, DefaultPoolAmount, DestinationChainID, SourceChainID } from '../util/constants';
//
// const { expect } = require('chai');
// const { waffle } = require('hardhat');
//
// export function testBridgeDeposit(
//   mystikoContract: any,
//   mystikoDstContract: any,
//   proxyContract: any,
//   testTokenContract: TestToken,
//   accounts: Wallet[],
//   depositAmount: string,
//   isMainAsset: boolean,
//   isDstMainAsset: boolean,
//   cmInfo: CommitmentInfo,
// ) {
//   let minBridgeFee: number;
//   let minRollupFee: number;
//   let minExecutorFee: number;
//   let minTotalAmount: string;
//   let minTotalValue: string;
//   const { commitments } = cmInfo;
//   const numOfCommitments = commitments.length;
//   const bridgeAccount = accounts[BridgeAccountIndex];
//   const bridgeMessages: any[] = [];
//   const v1Protocol = new MystikoProtocolV1();
//
//   describe('Test Mystiko deposit operation', () => {
//     before(async () => {
//       minBridgeFee = (await mystikoContract.minBridgeFee()).toString();
//       minExecutorFee = (await mystikoContract.minExecutorFee()).toString();
//       minRollupFee = (await mystikoContract.minRollupFee()).toString();
//
//       const amount = toBN(depositAmount).add(toBN(minExecutorFee)).add(toBN(minRollupFee));
//       minTotalAmount = amount.toString();
//       if (isMainAsset) {
//         minTotalValue = amount.add(toBN(minBridgeFee)).toString();
//       } else {
//         minTotalValue = toBN(minBridgeFee).toString();
//       }
//
//       if (isDstMainAsset) {
//         await accounts[0].sendTransaction({
//           to: mystikoDstContract.address,
//           value: DefaultPoolAmount,
//         });
//       } else {
//         await testTokenContract.transfer(mystikoDstContract.address, DefaultPoolAmount);
//       }
//
//       await proxyContract.changeOperator(bridgeAccount.address);
//       await mystikoContract.setPeerContractAddress(mystikoDstContract.address);
//       await mystikoDstContract.setPeerContractAddress(mystikoContract.address);
//     });
//
//     it('should revert when deposit is disabled', async () => {
//       await mystikoContract.toggleDeposits(true);
//       await expect(
//         mystikoContract.deposit(
//           depositAmount,
//           commitments[0].commitmentHash.toString(),
//           commitments[0].k.toString(),
//           commitments[0].randomS.toString(),
//           toHex(commitments[0].privateNote),
//           minBridgeFee,
//           minExecutorFee,
//           minRollupFee,
//           { from: accounts[0].address, value: minTotalValue },
//         ),
//       ).to.be.revertedWith('deposits are disabled');
//       await mystikoContract.toggleDeposits(false);
//     });
//
//     it('should revert when bridge fee is too few', async () => {
//       await expect(
//         mystikoContract.deposit(
//           depositAmount,
//           commitments[0].commitmentHash.toString(),
//           commitments[0].k.toString(),
//           commitments[0].randomS.toString(),
//           toHex(commitments[0].privateNote),
//           '0',
//           minExecutorFee,
//           minRollupFee,
//           { from: accounts[0].address, value: minTotalValue },
//         ),
//       ).to.be.revertedWith('bridge fee too few');
//     });
//
//     it('should revert when rollup fee is too few', async () => {
//       await expect(
//         mystikoContract.deposit(
//           depositAmount,
//           commitments[0].commitmentHash.toString(),
//           commitments[0].k.toString(),
//           commitments[0].randomS.toString(),
//           toHex(commitments[0].privateNote),
//           minBridgeFee,
//           '0',
//           minRollupFee,
//           { from: accounts[0].address, value: minTotalValue },
//         ),
//       ).to.be.revertedWith('executor fee too few');
//     });
//
//     it('should revert when rollup fee is too few', async () => {
//       await expect(
//         mystikoContract.deposit(
//           depositAmount,
//           commitments[0].commitmentHash.toString(),
//           commitments[0].k.toString(),
//           commitments[0].randomS.toString(),
//           toHex(commitments[0].privateNote),
//           minBridgeFee,
//           minExecutorFee,
//           '0',
//           { from: accounts[0].address, value: minTotalValue },
//         ),
//       ).to.be.revertedWith('rollup fee too few');
//     });
//
//     it('should revert when commitmentHash is incorrect', async () => {
//       await expect(
//         mystikoContract.deposit(
//           depositAmount,
//           commitments[0].commitmentHash.toString(),
//           v1Protocol.randomBigInt().toString(),
//           commitments[0].randomS.toString(),
//           toHex(commitments[0].privateNote),
//           minBridgeFee,
//           minExecutorFee,
//           minRollupFee,
//           { from: accounts[0].address, value: minTotalValue },
//         ),
//       ).to.be.revertedWith('commitment hash incorrect');
//     });
//
//     it('should approve asset successfully', async () => {
//       if (!isMainAsset) {
//         const approveAmount = toBN(minTotalAmount).muln(commitments.length).toString();
//         await testTokenContract.approve(mystikoContract.address, approveAmount, {
//           from: accounts[0].address,
//         });
//       }
//     });
//
//     it('should deposit successfully', async () => {
//       for (let i = 0; i < numOfCommitments; i += 1) {
//         const depositTx = await mystikoContract.deposit(
//           depositAmount,
//           commitments[i].commitmentHash.toString(),
//           commitments[i].k.toString(),
//           commitments[i].randomS.toString(),
//           toHex(commitments[i].privateNote),
//           minBridgeFee,
//           minExecutorFee,
//           minRollupFee,
//           { from: accounts[0].address, value: minTotalValue },
//         );
//         expect(depositTx)
//           .to.emit(mystikoContract, 'EncryptedNote')
//           .withArgs(commitments[i].commitmentHash, toHex(commitments[i].privateNote));
//
//         expect(await mystikoContract.depositedCommitments(commitments[i].commitmentHash.toString())).to.equal(
//           true,
//         );
//         expect(await mystikoContract.sourceDepositCount()).to.equal(i + 1);
//
//         const txReceipt = await waffle.provider.getTransactionReceipt(depositTx.hash);
//         const start = txReceipt.blockNumber;
//         const bridgeEvents = await proxyContract.queryFilter('TBridgeCrossChainMessage', start, start);
//         expect(bridgeEvents).to.not.equal(undefined);
//         expect(bridgeEvents.length).to.equal(1);
//         expect(bridgeEvents[0].args.toContract).to.equal(mystikoDstContract.address);
//         expect(bridgeEvents[0].args.toChainId.toNumber()).to.equal(DestinationChainID);
//         expect(bridgeEvents[0].args.fromContract).to.equal(mystikoContract.address);
//         bridgeMessages.push(bridgeEvents[0].args.message);
//
//         // todo check contract deposit balance
//       }
//     });
//
//     it('should bridge deposit transaction success', async () => {
//       for (let i = 0; i < numOfCommitments; i += 1) {
//         if (!isDstMainAsset) {
//           const approveAmount = toBN(minTotalAmount).muln(commitments.length).toString();
//           await testTokenContract.connect(bridgeAccount).approve(mystikoContract.address, approveAmount, {
//             from: bridgeAccount.address,
//           });
//         }
//
//         const balanceBefore = isDstMainAsset
//           ? await waffle.provider.getBalance(bridgeAccount.address)
//           : await testTokenContract.balanceOf(bridgeAccount.address);
//
//         const txProxy = await proxyContract
//           .connect(bridgeAccount)
//           .crossChainSyncTx(
//             SourceChainID,
//             mystikoContract.address,
//             mystikoDstContract.address,
//             bridgeMessages[i],
//           );
//
//         const txReceipt = await waffle.provider.getTransactionReceipt(txProxy.hash);
//         const totalGasFee = txReceipt.cumulativeGasUsed.mul(txReceipt.effectiveGasPrice);
//
//         const balanceAfter = isDstMainAsset
//           ? await waffle.provider.getBalance(bridgeAccount.address)
//           : await testTokenContract.balanceOf(bridgeAccount.address);
//
//         if (isDstMainAsset) {
//           expect(minExecutorFee.toString()).to.equal(
//             balanceAfter.add(totalGasFee).sub(balanceBefore).toString(),
//           );
//         } else {
//           expect(minExecutorFee.toString()).to.equal(balanceAfter.sub(balanceBefore).toString());
//         }
//
//         expect(await mystikoDstContract.relayCommitments(commitments[i].commitmentHash.toString())).to.equal(
//           true,
//         );
//         expect((await mystikoDstContract.depositQueue(`${i}`)).commitment.toString()).to.equal(
//           commitments[i].commitmentHash.toString(),
//         );
//         expect((await mystikoDstContract.depositQueue(`${i}`)).rollupFee.toString()).to.equal(minRollupFee);
//
//         // todo check dst contract balance
//         // todo proxy parameter check
//       }
//
//       expect((await mystikoDstContract.depositQueueSize()).toString()).to.equal(`${commitments.length}`);
//     });
//
//     it('should source contract have correct balance', async () => {
//       const expectBalance = toBN(minTotalAmount).muln(numOfCommitments).toString();
//       if (isMainAsset) {
//         expect(await waffle.provider.getBalance(mystikoContract.address)).to.equal(expectBalance);
//       } else {
//         expect((await testTokenContract.balanceOf(mystikoContract.address)).toString()).to.equal(
//           expectBalance,
//         );
//       }
//     });
//
//     it('should revert with duplicate commitment', async () => {
//       await expect(
//         mystikoContract.deposit(
//           depositAmount,
//           commitments[0].commitmentHash.toString(),
//           commitments[0].k.toString(),
//           commitments[0].randomS.toString(),
//           toHex(commitments[0].privateNote),
//           minBridgeFee,
//           minExecutorFee,
//           minRollupFee,
//           { from: accounts[0].address, value: minTotalValue },
//         ),
//       ).to.be.revertedWith('the commitment has been submitted');
//     });
//   });
//
//   // todo add merkle tree test
// }
