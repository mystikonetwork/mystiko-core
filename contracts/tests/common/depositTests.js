import BN from 'bn.js';
import { expectThrowsAsync } from './utils.js';
import {
  commitmentWithShieldedAddress,
  randomBigInt,
  randomBytes,
  secretKeyForVerification,
  secretKeyForEncryption,
  publicKeyForVerification,
  publicKeyForEncryption,
  shieldedAddress,
  VERIFY_SK_SIZE,
  ENCRYPT_SK_SIZE,
} from '../../../src/protocol';
import { toHex } from '../../../src/utils.js';

const TestTokenContract = artifacts.require('TestToken');

export function testDeposit(
  contractGetter,
  accounts,
  { depositAmount, isMainAsset = true, numOfCommitments = 4, checkEnqueue = true },
) {
  let mystikoContract;
  let testTokenContract;
  const commitments = [];
  let minTotalAmount;
  let minRollupFee;
  let pkVerify, rawSkVerify, skVerify, pkEnc, rawSkEnc, skEnc;
  let mystikoAddress;
  describe('Test Mystiko deposit operation', () => {
    before(async () => {
      mystikoContract = await contractGetter();
      testTokenContract = await TestTokenContract.deployed();
      rawSkVerify = randomBytes(VERIFY_SK_SIZE);
      rawSkEnc = randomBytes(ENCRYPT_SK_SIZE);
      pkVerify = publicKeyForVerification(rawSkVerify);
      skVerify = secretKeyForVerification(rawSkVerify);
      pkEnc = publicKeyForEncryption(rawSkEnc);
      skEnc = secretKeyForEncryption(rawSkEnc);
      mystikoAddress = shieldedAddress(pkVerify, pkEnc);
      for (let i = 0; i < numOfCommitments; i++) {
        const commitment = await commitmentWithShieldedAddress(mystikoAddress, new BN(depositAmount));
        commitments.push(commitment);
      }
      minRollupFee = (await mystikoContract.minRollupFee()).toString();
      minTotalAmount = new BN(depositAmount).add(new BN(minRollupFee)).toString();
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
          minRollupFee,
          { from: accounts[0], value: isMainAsset ? minTotalAmount : '0' },
        ),
      );
      await mystikoContract.toggleDeposits(false, { from: accounts[0], gas: estimateGas });
    });
    it('should revert when rollup fee is too few', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.deposit.estimateGas(
          depositAmount,
          commitments[0].commitmentHash.toString(),
          commitments[0].k.toString(),
          commitments[0].randomS.toString(),
          toHex(commitments[0].privateNote),
          '0',
          { from: accounts[0], value: isMainAsset ? minTotalAmount : '0' },
        ),
      );
    });
    it('should revert when commitmentHash is incorrect', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.deposit.estimateGas(
          depositAmount,
          commitments[0].commitmentHash.toString(),
          randomBigInt().toString(),
          commitments[0].randomS.toString(),
          toHex(commitments[0].privateNote),
          minRollupFee,
          { from: accounts[0], value: isMainAsset ? minTotalAmount : '0' },
        ),
      );
    });
    it('should approve asset successfully', async () => {
      if (!isMainAsset) {
        const approveAmount = new BN(minTotalAmount).muln(commitments.length).toString();
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
        minRollupFee,
        { from: accounts[0], value: isMainAsset ? minTotalAmount : '0' },
      );
      const txs = [];
      for (let i = 0; i < numOfCommitments; i++) {
        const tx = await mystikoContract.deposit(
          depositAmount,
          commitments[i].commitmentHash.toString(),
          commitments[i].k.toString(),
          commitments[i].randomS.toString(),
          toHex(commitments[i].privateNote),
          minRollupFee,
          { from: accounts[0], value: isMainAsset ? minTotalAmount : '0', gas: estimateGas },
        );
        expect(await mystikoContract.depositedCommitments(commitments[i].commitmentHash.toString())).to.equal(
          true,
        );
        const noteEvent = tx.logs.find((e) => e['event'] === 'EncryptedNote');
        expect(noteEvent).to.not.equal(undefined);
        expect(noteEvent.args.commitment.toString()).to.equal(commitments[i].commitmentHash.toString());
        expect(noteEvent.args.encryptedNote).to.equal(toHex(commitments[i].privateNote));
        txs.push(tx);
      }
      if (checkEnqueue) {
        await _testDepositEnqueue(mystikoContract, depositAmount, minRollupFee, commitments, txs);
      }
    });
    it('should have correct balance', async () => {
      const expectBalance = new BN(minTotalAmount).muln(numOfCommitments).toString();
      if (isMainAsset) {
        expect((await web3.eth.getBalance(mystikoContract.address)).toString()).to.equal(expectBalance);
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
          minRollupFee,
          { from: accounts[0], value: isMainAsset ? minTotalAmount : '0' },
        ),
      );
    });
    it('should revert when tree is full', async () => {
      const mystikoContract2 = await contractGetter({ treeHeight: 1 });
      if (!isMainAsset) {
        const approveAmount = new BN(minTotalAmount).muln(3);
        await testTokenContract.approve(mystikoContract2.address, approveAmount.toString(), {
          from: accounts[0],
          gas: 1000000,
        });
      }
      for (let i = 0; i < 2; i++) {
        const commitment = await commitmentWithShieldedAddress(mystikoAddress, new BN(depositAmount));
        await mystikoContract2.deposit(
          depositAmount,
          commitment.commitmentHash.toString(),
          commitment.k.toString(),
          commitment.randomS.toString(),
          toHex(commitment.privateNote),
          minRollupFee,
          { from: accounts[0], value: isMainAsset ? minTotalAmount : '0', gas: 1000000 },
        );
      }
      const commitment = await commitmentWithShieldedAddress(mystikoAddress, new BN(depositAmount));
      await expectThrowsAsync(() =>
        mystikoContract2.deposit(
          depositAmount,
          commitment.commitmentHash.toString(),
          commitment.k.toString(),
          commitment.randomS.toString(),
          toHex(commitment.privateNote),
          minRollupFee,
          { from: accounts[0], value: isMainAsset ? minTotalAmount : '0', gas: 1000000 },
        ),
      );
    });
  });
  return { pkVerify, rawSkVerify, skVerify, pkEnc, rawSkEnc, skEnc, mystikoAddress, commitments };
}

async function _testDepositEnqueue(mystikoContract, depositAmount, minRollupFee, commitments, depositTxs) {
  expect((await mystikoContract.depositQueueSize()).toString()).to.equal(`${commitments.length}`);
  for (let i = 0; i < depositTxs.length; i++) {
    const enqueueEvent = depositTxs[i].logs.find((e) => e['event'] === 'DepositQueued');
    expect(enqueueEvent).to.not.equal(undefined);
    expect(enqueueEvent.args.commitment.toString()).to.equal(commitments[i].commitmentHash.toString());
    expect(enqueueEvent.args.amount.toString()).to.equal(depositAmount);
    expect(enqueueEvent.args.rollupFee.toString()).to.equal(minRollupFee);
    expect(enqueueEvent.args.leafIndex.toString()).to.equal(`${i}`);
    expect((await mystikoContract.depositQueue(`${i}`)).commitment.toString()).to.equal(
      commitments[i].commitmentHash.toString(),
    );
    expect((await mystikoContract.depositQueue(`${i}`)).rollupFee.toString()).to.equal(minRollupFee);
  }
}
