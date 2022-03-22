import { v1Protocol } from '@mystikonetwork/protocol';
import { toHex, toBN, toDecimals } from '@mystikonetwork/utils';
import { expectThrowsAsync } from './utils.js';

const TestTokenContract = artifacts.require('TestToken');
const DefaultSourceChainID = 1001;
const DefaultDestinationChainID = 1002;
const DefaultPoolAmount = toDecimals(5).toString();

export function testBridgeDeposit(
  srcContractGetter,
  dstContractGetter,
  proxyContractGetter,
  accounts,
  { depositAmount, isSrcMainAsset, isDstMainAsset, numOfCommitments = 4, checkEnqueue = true },
) {
  let mystikoContract;
  let dstMystikoContract;
  let proxyContract;
  let testTokenContract;
  const commitments = [];
  const bridgeMessages = [];
  let minTotalAmount;
  let minTotalValue;
  let minBridgeFee;
  let minExecutorFee;
  let minRollupFee;
  let pkVerify, rawSkVerify, skVerify, pkEnc, rawSkEnc, skEnc;
  let mystikoAddress;
  let bridgeAccount = accounts[3];
  describe('Test Mystiko deposit operation', () => {
    before(async () => {
      mystikoContract = await srcContractGetter();
      dstMystikoContract = await dstContractGetter();
      proxyContract = await proxyContractGetter();
      testTokenContract = await TestTokenContract.deployed();
      rawSkVerify = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
      rawSkEnc = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
      pkVerify = v1Protocol.publicKeyForVerification(rawSkVerify);
      skVerify = v1Protocol.secretKeyForVerification(rawSkVerify);
      pkEnc = v1Protocol.publicKeyForEncryption(rawSkEnc);
      skEnc = v1Protocol.secretKeyForEncryption(rawSkEnc);
      mystikoAddress = v1Protocol.shieldedAddress(pkVerify, pkEnc);
      for (let i = 0; i < numOfCommitments; i++) {
        const commitment = await v1Protocol.commitmentWithShieldedAddress(
          mystikoAddress,
          toBN(depositAmount),
        );
        commitments.push(commitment);
      }
      minBridgeFee = (await mystikoContract.minBridgeFee()).toString();
      minExecutorFee = (await mystikoContract.minExecutorFee()).toString();
      minRollupFee = (await mystikoContract.minRollupFee()).toString();

      const amount = toBN(depositAmount).add(toBN(minExecutorFee)).add(toBN(minRollupFee));
      minTotalAmount = amount.toString();
      if (isSrcMainAsset) {
        minTotalValue = amount.add(toBN(minBridgeFee)).toString();
      } else {
        minTotalValue = toBN(minBridgeFee).toString();
      }

      if (isDstMainAsset) {
        await web3.eth.sendTransaction({
          from: accounts[9],
          to: dstMystikoContract.address,
          value: DefaultPoolAmount,
        });
      } else {
        await testTokenContract.transfer(dstMystikoContract.address, DefaultPoolAmount, {
          from: accounts[0],
        });
      }
      await proxyContract.changeOperator(bridgeAccount);
    });
    it('should revert when deposit is disabled', async () => {
      let estimateGas = await mystikoContract.toggleDeposits.estimateGas(true, { from: accounts[0] });
      await mystikoContract.toggleDeposits(true, { from: accounts[0], gas: estimateGas });
      await expectThrowsAsync(() =>
        mystikoContract.deposit.estimateGas(
          depositAmount,
          commitments[0].commitmentHash.toString(),
          commitments[0].k.toString(),
          commitments[0].randomS.toString(),
          toHex(commitments[0].privateNote),
          minBridgeFee,
          minExecutorFee,
          minRollupFee,
          { from: accounts[0], value: minTotalValue },
        ),
      );
      await mystikoContract.toggleDeposits(false, { from: accounts[0], gas: estimateGas });
    });
    it('should revert when bridge fee is too few', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.deposit.estimateGas(
          depositAmount,
          commitments[0].commitmentHash.toString(),
          commitments[0].k.toString(),
          commitments[0].randomS.toString(),
          toHex(commitments[0].privateNote),
          0,
          minExecutorFee,
          minRollupFee,
          { from: accounts[0], value: minTotalValue },
        ),
      );
    });
    it('should revert when executor fee is too few', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.deposit.estimateGas(
          depositAmount,
          commitments[0].commitmentHash.toString(),
          commitments[0].k.toString(),
          commitments[0].randomS.toString(),
          toHex(commitments[0].privateNote),
          minBridgeFee,
          0,
          minRollupFee,
          { from: accounts[0], value: minTotalValue },
        ),
      );
    });
    it('should revert when rollup fee is too few', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.deposit.estimateGas(
          depositAmount,
          commitments[0].commitmentHash.toString(),
          commitments[0].k.toString(),
          commitments[0].randomS.toString(),
          toHex(commitments[0].privateNote),
          minBridgeFee,
          minExecutorFee,
          '0',
          { from: accounts[0], value: minTotalValue },
        ),
      );
    });
    it('should revert when commitmentHash is incorrect', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.deposit.estimateGas(
          depositAmount,
          commitments[0].commitmentHash.toString(),
          v1Protocol.randomBigInt().toString(),
          commitments[0].randomS.toString(),
          toHex(commitments[0].privateNote),
          minBridgeFee,
          minExecutorFee,
          minRollupFee,
          { from: accounts[0], value: minTotalValue },
        ),
      );
    });
    it('should approve asset successfully', async () => {
      if (!isSrcMainAsset) {
        const approveAmount = toBN(minTotalAmount).muln(commitments.length).toString();
        const estimateGas = await testTokenContract.approve.estimateGas(
          mystikoContract.address,
          approveAmount,
          { from: accounts[0] },
        );
        await testTokenContract.approve(mystikoContract.address, approveAmount, {
          from: accounts[0],
          gas: estimateGas,
        });
      }
    });
    it('should deposit successfully', async () => {
      let estimateGas = await mystikoContract.deposit.estimateGas(
        depositAmount,
        commitments[0].commitmentHash.toString(),
        commitments[0].k.toString(),
        commitments[0].randomS.toString(),
        toHex(commitments[0].privateNote),
        minBridgeFee,
        minExecutorFee,
        minRollupFee,
        { from: accounts[0], value: minTotalValue },
      );
      const txs = [];
      let start = 0;
      let end = 0;
      for (let i = 0; i < numOfCommitments; i++) {
        const tx = await mystikoContract.deposit(
          depositAmount,
          commitments[i].commitmentHash.toString(),
          commitments[i].k.toString(),
          commitments[i].randomS.toString(),
          toHex(commitments[i].privateNote),
          minBridgeFee,
          minExecutorFee,
          minRollupFee,
          { from: accounts[0], value: minTotalValue, gas: estimateGas + 20000 },
        );
        expect(await mystikoContract.depositedCommitments(commitments[i].commitmentHash.toString())).to.equal(
          true,
        );
        const noteEvent = tx.logs.find((e) => e['event'] === 'EncryptedNote');
        expect(noteEvent).to.not.equal(undefined);
        expect(noteEvent.args.commitment.toString()).to.equal(commitments[i].commitmentHash.toString());
        expect(noteEvent.args.encryptedNote).to.equal(toHex(commitments[i].privateNote));
        txs.push(tx);

        start = tx.receipt.blockNumber;
        const bridgeEvent = await proxyContract.getPastEvents('TBridgeCrossChainMessage', {
          fromBlock: start,
          toBlock: start,
        });
        expect(bridgeEvent).to.not.equal(undefined);
        expect(bridgeEvent[0].args.toContract).to.equal(dstMystikoContract.address);
        expect(bridgeEvent[0].args.toChainId.toNumber()).to.equal(DefaultDestinationChainID);
        expect(bridgeEvent[0].args.fromContract).to.equal(mystikoContract.address);
        bridgeMessages.push(bridgeEvent[0].args.message);
      }

      //proxy deposit transaction
      for (let i = 0; i < numOfCommitments; i++) {
        const balanceBefore = isDstMainAsset
          ? await web3.eth.getBalance(bridgeAccount)
          : await testTokenContract.balanceOf(bridgeAccount);

        const tx = await proxyContract.crossChainSyncTx(
          DefaultSourceChainID,
          mystikoContract.address,
          dstMystikoContract.address,
          bridgeMessages[i],
          { from: bridgeAccount },
        );
        end = tx.receipt.blockNumber;

        const balanceAfter = isDstMainAsset
          ? await web3.eth.getBalance(bridgeAccount)
          : await testTokenContract.balanceOf(bridgeAccount);

        const totalGasFee = tx.receipt.gasUsed * (await web3.eth.getGasPrice());
        if (isDstMainAsset) {
          expect(minExecutorFee.toString()).to.equal(
            toBN(balanceAfter).add(toBN(totalGasFee)).sub(toBN(balanceBefore)).toString(),
          );
        } else {
          expect(minExecutorFee.toString()).to.equal(toBN(balanceAfter).sub(toBN(balanceBefore)).toString());
        }
      }

      if (checkEnqueue) {
        await _testDepositEnqueue(
          dstMystikoContract,
          depositAmount,
          minExecutorFee,
          minRollupFee,
          commitments,
          start,
          end,
        );
      }
    });
    it('should have correct balance', async () => {
      const expectBalance = toBN(minTotalAmount).muln(numOfCommitments).toString();
      const expectBridgeFee = toBN(minBridgeFee).muln(numOfCommitments).toString();

      if (isSrcMainAsset) {
        expect((await web3.eth.getBalance(mystikoContract.address)).toString()).to.equal(expectBalance);
        expect((await web3.eth.getBalance(proxyContract.address)).toString()).to.equal(expectBridgeFee);
      } else {
        expect((await testTokenContract.balanceOf(mystikoContract.address)).toString()).to.equal(
          expectBalance,
        );
      }
    });
    it('should revert with duplicate commitment', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.deposit.estimateGas(
          depositAmount,
          commitments[0].commitmentHash.toString(),
          commitments[0].k.toString(),
          commitments[0].randomS.toString(),
          toHex(commitments[0].privateNote),
          minBridgeFee,
          minExecutorFee,
          minRollupFee,
          { from: accounts[0], value: minTotalValue },
        ),
      );
    });
    it('should deposit revert when tree is full', async () => {
      const mystikoContract2 = await srcContractGetter({ treeHeight: 1 });
      if (!isSrcMainAsset) {
        const approveAmount = toBN(minTotalAmount).muln(3);
        await testTokenContract.approve(mystikoContract2.address, approveAmount.toString(), {
          from: accounts[0],
          gas: 1000000,
        });
      }

      for (let i = 0; i < 2; i++) {
        const commitment = await v1Protocol.commitmentWithShieldedAddress(
          mystikoAddress,
          toBN(depositAmount),
        );
        await mystikoContract2.deposit(
          depositAmount,
          commitment.commitmentHash.toString(),
          commitment.k.toString(),
          commitment.randomS.toString(),
          toHex(commitment.privateNote),
          minBridgeFee,
          minExecutorFee,
          minRollupFee,
          { from: accounts[0], value: minTotalValue, gas: 1000000 },
        );
      }

      const commitment = await v1Protocol.commitmentWithShieldedAddress(mystikoAddress, toBN(depositAmount));
      await expectThrowsAsync(() =>
        mystikoContract2.deposit(
          depositAmount,
          commitment.commitmentHash.toString(),
          commitment.k.toString(),
          commitment.randomS.toString(),
          toHex(commitment.privateNote),
          minBridgeFee,
          minExecutorFee,
          minRollupFee,
          { from: accounts[0], value: minTotalValue, gas: 1000000 },
        ),
      );
    });
    it('should bridge syncDepositTx revert when tree is full', async () => {
      const mystikoContractDst = await dstContractGetter({ treeHeight: 1 });
      await mystikoContractDst.setPeerContractAddress(mystikoContract.address);

      if (isDstMainAsset) {
        await web3.eth.sendTransaction({
          from: accounts[9],
          to: mystikoContractDst.address,
          value: toDecimals(1).toString(),
        });
      } else {
        await testTokenContract.transfer(mystikoContractDst.address, DefaultPoolAmount, {
          from: accounts[0],
        });
      }

      for (let i = 0; i < 2; i++) {
        const rsp = await proxyContract.crossChainSyncTx(
          DefaultSourceChainID,
          mystikoContract.address,
          mystikoContractDst.address,
          bridgeMessages[i],
          { from: bridgeAccount },
        );
        expect(rsp).to.not.equal(undefined);
      }

      await expectThrowsAsync(() =>
        proxyContract.crossChainSyncTx(
          DefaultSourceChainID,
          mystikoContract.address,
          mystikoContractDst.address,
          bridgeMessages[2],
          { from: bridgeAccount },
        ),
      );
    });
  });
  return { pkVerify, rawSkVerify, skVerify, pkEnc, rawSkEnc, skEnc, mystikoAddress, commitments };
}

async function _testDepositEnqueue(
  mystikoContract,
  depositAmount,
  minExecutorFee,
  minRollupFee,
  commitments,
  start,
  end,
) {
  expect((await mystikoContract.depositQueueSize()).toString()).to.equal(`${commitments.length}`);

  const enqueueEvents = await mystikoContract.getPastEvents('DepositQueued', {
    fromBlock: start,
    toBlock: end,
  });
  expect(enqueueEvents.length.toString()).to.equal(`${commitments.length}`);

  for (let i = 0; i < commitments.length; i++) {
    expect(await mystikoContract.relayCommitments(commitments[i].commitmentHash.toString())).to.equal(true);

    const depositInfo = await mystikoContract.depositQueue(i.toString());
    expect(depositInfo.commitment.toString()).to.equal(commitments[i].commitmentHash.toString());
    expect(depositInfo.rollupFee.toString()).to.equal(minRollupFee.toString());

    expect(enqueueEvents[i].args.commitment.toString()).to.equal(commitments[i].commitmentHash.toString());
    expect(enqueueEvents[i].args.amount.toString()).to.equal(depositAmount);
    expect(enqueueEvents[i].args.executorFee.toString()).to.equal(minExecutorFee);
    expect(enqueueEvents[i].args.rollupFee.toString()).to.equal(minRollupFee);
    expect(enqueueEvents[i].args.leafIndex.toString()).to.equal(`${i}`);
  }
}
