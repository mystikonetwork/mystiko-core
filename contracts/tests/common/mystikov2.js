import BN from 'bn.js';
import { MerkleTree } from '../../../src/lib/merkleTree.js';
import { commitmentWithShieldedAddress, randomBigInt } from '../../../src/protocol';
import { toHex } from '../../../src/utils.js';
import { zkProveRollup1, zkProveRollup4, zkProveRollup16 } from '../../../src/rollup/protocol.js';

const TestTokenContract = artifacts.require('TestToken');

let mystikoContract;
let withdrawVerifierContract;
let testTokenContract;

export async function expectThrowsAsync(method, errorMessage) {
  let error;
  try {
    await method();
  } catch (err) {
    error = err;
  }
  expect(error).to.not.equal(undefined);
  if (errorMessage) {
    expect(error.toString()).to.equal(errorMessage);
  }
}

export function testConstructor({
  MystikoContract,
  WithdrawVerifierContract,
  treeHeight = 20,
  rootHistoryLength = 30,
  minRollupFee,
}) {
  describe('Test Mystiko contract constructor', () => {
    before(async () => {
      mystikoContract = await MystikoContract.deployed();
      withdrawVerifierContract = await WithdrawVerifierContract.deployed();
    });
    it('should initialize withdraw verifier correctly', async () => {
      expect(await mystikoContract.withdrawVerifier()).to.equal(withdrawVerifierContract.address);
    });
    it('should initialize minRollupFee correctly', async () => {
      expect((await mystikoContract.minRollupFee()).toString()).to.equal(minRollupFee);
    });
    it('should initialize depositQueue related resources correctly', async () => {
      expect((await mystikoContract.depositQueueSize()).toNumber()).to.equal(0);
      expect((await mystikoContract.depositIncludedCount()).toNumber()).to.equal(0);
    });
    it('should initialize tree related resources correctly', async () => {
      const defaultZero = MerkleTree.calcDefaultZeroElement();
      const zeros = MerkleTree.calcZeros(defaultZero, treeHeight);
      expect((await mystikoContract.treeCapacity()).toNumber()).to.equal(2 ** treeHeight);
      expect((await mystikoContract.currentRoot()).toString()).to.equal(zeros[treeHeight].toString());
      expect((await mystikoContract.currentRootIndex()).toNumber()).to.equal(0);
      expect((await mystikoContract.rootHistory(0)).toString()).to.equal(zeros[treeHeight].toString());
      expect((await mystikoContract.rootHistoryLength()).toNumber()).to.equal(rootHistoryLength);
    });
    it('should initialize admin related resources correctly', async () => {
      expect(await mystikoContract.isDepositsDisabled()).to.equal(false);
      expect(await mystikoContract.isVerifierUpdateDisabled()).to.equal(false);
      expect(await mystikoContract.isRollupWhitelistDisabled()).to.equal(false);
    });
  });
}

export function testAdminOperations({ MystikoContract, accounts }) {
  describe('Test Mystiko admin operations', () => {
    before(async () => {
      mystikoContract = await MystikoContract.deployed();
    });
    it('should toggle isDepositDisabled correctly', async () => {
      await expectThrowsAsync(() => mystikoContract.toggleDeposits.estimateGas(true, { from: accounts[1] }));
      const gasEstimate = await mystikoContract.toggleDeposits.estimateGas(true, { from: accounts[0] });
      await mystikoContract.toggleDeposits(true, { from: accounts[0], gas: gasEstimate });
      expect(await mystikoContract.isDepositsDisabled()).to.equal(true);
      await mystikoContract.toggleDeposits(false, { from: accounts[0], gas: gasEstimate });
      expect(await mystikoContract.isDepositsDisabled()).to.equal(false);
    });
    it('should toggle isRollupWhitelistDisabled correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.toggleRollupWhitelist.estimateGas(true, { from: accounts[1] }),
      );
      const gasEstimate = await mystikoContract.toggleRollupWhitelist.estimateGas(true, {
        from: accounts[0],
      });
      await mystikoContract.toggleRollupWhitelist(true, { from: accounts[0], gas: gasEstimate });
      expect(await mystikoContract.isRollupWhitelistDisabled()).to.equal(true);
      await mystikoContract.toggleRollupWhitelist(false, { from: accounts[0], gas: gasEstimate });
      expect(await mystikoContract.isRollupWhitelistDisabled()).to.equal(false);
    });
    it('should toggle isVerifierUpdateDisabled correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.toggleVerifierUpdate.estimateGas(true, { from: accounts[1] }),
      );
      const gasEstimate = await mystikoContract.toggleVerifierUpdate.estimateGas(true, {
        from: accounts[0],
      });
      await mystikoContract.toggleVerifierUpdate(true, { from: accounts[0], gas: gasEstimate });
      expect(await mystikoContract.isVerifierUpdateDisabled()).to.equal(true);
      await mystikoContract.toggleVerifierUpdate(false, { from: accounts[0], gas: gasEstimate });
      expect(await mystikoContract.isVerifierUpdateDisabled()).to.equal(false);
    });
    it('should setWithdrawVerifier correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.setWithdrawVerifier('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
          from: accounts[1],
        }),
      );
      let gasEstimate = await mystikoContract.setWithdrawVerifier.estimateGas(
        '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f',
        {
          from: accounts[0],
        },
      );
      await mystikoContract.setWithdrawVerifier('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
        from: accounts[0],
        gas: gasEstimate,
      });
      expect(await mystikoContract.withdrawVerifier()).to.equal('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f');
      gasEstimate = await mystikoContract.toggleVerifierUpdate.estimateGas(true, {
        from: accounts[0],
      });
      await mystikoContract.toggleVerifierUpdate(true, { from: accounts[0], gas: gasEstimate });
      await expectThrowsAsync(() =>
        mystikoContract.setWithdrawVerifier('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
          from: accounts[0],
        }),
      );
      await mystikoContract.toggleVerifierUpdate(false, { from: accounts[0], gas: gasEstimate });
    });
    it('should enableRollupVerifier correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.enableRollupVerifier.estimateGas(4, '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
          from: accounts[1],
        }),
      );
      await expectThrowsAsync(() =>
        mystikoContract.enableRollupVerifier.estimateGas(0, '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
          from: accounts[0],
        }),
      );
      let estimateGas = await mystikoContract.enableRollupVerifier.estimateGas(
        4,
        '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f',
        {
          from: accounts[0],
        },
      );
      await mystikoContract.enableRollupVerifier(4, '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
        from: accounts[0],
        gas: estimateGas,
      });
      const verifier = await mystikoContract.rollupVerifiers(4);
      expect(verifier.verifier).to.equal('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f');
      expect(verifier.enabled).to.equal(true);
      estimateGas = await mystikoContract.toggleVerifierUpdate.estimateGas(true, {
        from: accounts[0],
      });
      await mystikoContract.toggleVerifierUpdate(true, { from: accounts[0], gas: estimateGas });
      await expectThrowsAsync(() =>
        mystikoContract.enableRollupVerifier.estimateGas(4, '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
          from: accounts[0],
        }),
      );
      await mystikoContract.toggleVerifierUpdate(false, { from: accounts[0], gas: estimateGas });
    });
    it('should disableRollupVerifier correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.disableRollupVerifier.estimateGas(4, {
          from: accounts[1],
        }),
      );
      await expectThrowsAsync(() =>
        mystikoContract.disableRollupVerifier.estimateGas(0, {
          from: accounts[0],
        }),
      );
      let estimateGas = await mystikoContract.enableRollupVerifier.estimateGas(
        4,
        '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f',
        {
          from: accounts[0],
        },
      );
      await mystikoContract.enableRollupVerifier(4, '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
        from: accounts[0],
        gas: estimateGas,
      });
      estimateGas = await mystikoContract.disableRollupVerifier.estimateGas(4, {
        from: accounts[0],
      });
      await mystikoContract.disableRollupVerifier(4, {
        from: accounts[0],
        gas: estimateGas,
      });
      const verifier = await mystikoContract.rollupVerifiers(4);
      expect(verifier.verifier).to.equal('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f');
      expect(verifier.enabled).to.equal(false);
      estimateGas = await mystikoContract.toggleVerifierUpdate.estimateGas(true, {
        from: accounts[0],
      });
      await mystikoContract.toggleVerifierUpdate(true, { from: accounts[0], gas: estimateGas });
      await expectThrowsAsync(() =>
        mystikoContract.disableRollupVerifier.estimateGas(4, {
          from: accounts[0],
        }),
      );
      await mystikoContract.toggleVerifierUpdate(false, { from: accounts[0], gas: estimateGas });
    });
    it('should addRollupWhitelist correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.addRollupWhitelist.estimateGas('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
          from: accounts[1],
        }),
      );
      expect(await mystikoContract.rollupWhitelist('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f')).to.equal(
        false,
      );
      let estimateGas = mystikoContract.addRollupWhitelist.estimateGas(
        '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f',
        { from: accounts[0] },
      );
      await mystikoContract.addRollupWhitelist('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
        from: accounts[0],
        gas: estimateGas,
      });
      expect(await mystikoContract.rollupWhitelist('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f')).to.equal(
        true,
      );
    });
    it('should removeRollupWhitelist correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.removeRollupWhitelist.estimateGas('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
          from: accounts[1],
        }),
      );
      let estimateGas = mystikoContract.addRollupWhitelist.estimateGas(
        '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f',
        { from: accounts[0] },
      );
      await mystikoContract.addRollupWhitelist('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
        from: accounts[0],
        gas: estimateGas,
      });
      estimateGas = mystikoContract.removeRollupWhitelist.estimateGas(
        '0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f',
        { from: accounts[0] },
      );
      await mystikoContract.removeRollupWhitelist('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f', {
        from: accounts[0],
        gas: estimateGas,
      });
      expect(await mystikoContract.rollupWhitelist('0xfbb61B8b98a59FbC4bD79C23212AddbEFaEB289f')).to.equal(
        false,
      );
    });
    it('should changeOperator correctly', async () => {
      await expectThrowsAsync(() =>
        mystikoContract.changeOperator.estimateGas(accounts[1], { from: accounts[1] }),
      );
      let estimateGas = await mystikoContract.changeOperator.estimateGas(accounts[1], { from: accounts[0] });
      await mystikoContract.changeOperator(accounts[1], { from: accounts[0], gas: estimateGas });
      expect(await mystikoContract.operator()).to.equal(accounts[1]);
      await mystikoContract.changeOperator(accounts[0], { from: accounts[1], gas: estimateGas });
      expect(await mystikoContract.operator()).to.equal(accounts[0]);
    });
  });
}

export function testDeposit({
  MystikoContract,
  accounts,
  depositAmount,
  isMainAsset = true,
  numOfCommitments = 4,
  checkEnqueue = true,
}) {
  const commitments = [];
  let minTotalAmount;
  let minRollupFee;
  describe('Test Mystiko deposit operation', () => {
    before(async () => {
      mystikoContract = await MystikoContract.deployed();
      testTokenContract = await TestTokenContract.deployed();
      for (let i = 0; i < numOfCommitments; i++) {
        const commitment = await commitmentWithShieldedAddress(
          'EggPbWC9MXEiAj3XBcfaN7c7z9taax5Dm429MPP4UCUA7tsTqmqxgkwYYUwc6fzo8oTqMuDctvrHpcxgWx5W6Stmx',
          new BN(depositAmount),
        );
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
  });
}

export function testRollup({
  MystikoContract,
  RollupVerifierContract,
  accounts,
  rollupSize,
  treeHeight = 20,
  rootHistoryLength = 30,
}) {
  let depositIncludedCount;
  let depositQueueSize;
  let currentRoot;
  let currentRootIndex;
  let rollupVerifierContract;
  let proofA, proofB, proofC, newRoot, leafHash;
  const depositsInQueue = [];
  const newLeaves = [];
  describe('Test Mystiko rollup operation', () => {
    before(async () => {
      mystikoContract = await MystikoContract.deployed();
      rollupVerifierContract = await RollupVerifierContract.deployed();
      let estimateGas = await mystikoContract.enableRollupVerifier.estimateGas(
        rollupSize,
        rollupVerifierContract.address,
        { from: accounts[0] },
      );
      await mystikoContract.enableRollupVerifier(rollupSize, rollupVerifierContract.address, {
        from: accounts[0],
        gas: estimateGas,
      });
      estimateGas = await mystikoContract.addRollupWhitelist.estimateGas(accounts[0], { from: accounts[0] });
      await mystikoContract.addRollupWhitelist(accounts[0], {
        from: accounts[0],
        gas: estimateGas,
      });
      depositIncludedCount = (await mystikoContract.depositIncludedCount()).toNumber();
      expect(depositIncludedCount).to.equal(0);
      depositQueueSize = (await mystikoContract.depositQueueSize()).toNumber();
      expect(depositQueueSize).to.gte(rollupSize);
      currentRootIndex = (await mystikoContract.currentRootIndex()).toNumber();
      currentRoot = (await mystikoContract.currentRoot()).toString();
      expect((await mystikoContract.rootHistory(`${currentRootIndex}`)).toString()).to.equal(currentRoot);
      for (let i = 0; i < rollupSize; i++) {
        depositsInQueue.push(await mystikoContract.depositQueue(`${i + depositIncludedCount}`));
        newLeaves.push(new BN(depositsInQueue[i].commitment.toString()));
      }
      const tree = new MerkleTree(treeHeight);
      expect(tree.root().toString()).to.equal(currentRoot);
      let proof;
      if (rollupSize === 1) {
        proof = await zkProveRollup1(
          tree,
          newLeaves[0],
          'dist/circom/dev/Rollup1.wasm',
          'dist/circom/dev/Rollup1.zkey',
        );
      } else if (rollupSize === 4) {
        proof = await zkProveRollup4(
          tree,
          newLeaves,
          'dist/circom/dev/Rollup4.wasm',
          'dist/circom/dev/Rollup4.zkey',
        );
      } else if (rollupSize === 16) {
        proof = await zkProveRollup16(
          tree,
          newLeaves,
          'dist/circom/dev/Rollup16.wasm',
          'dist/circom/dev/Rollup16.zkey',
        );
      }
      expect(proof).to.not.equal(undefined);
      proofA = [proof.proof.pi_a[0], proof.proof.pi_a[1]];
      proofB = [
        [proof.proof.pi_b[0][1], proof.proof.pi_b[0][0]],
        [proof.proof.pi_b[1][1], proof.proof.pi_b[1][0]],
      ];
      proofC = [proof.proof.pi_c[0], proof.proof.pi_c[1]];
      newRoot = proof.publicSignals[1];
      leafHash = proof.publicSignals[3];
    });
    it('should rollup successfully', async () => {
      let estimateGas = await mystikoContract.rollup.estimateGas(
        proofA,
        proofB,
        proofC,
        `${rollupSize}`,
        newRoot,
        leafHash,
        { from: accounts[0] },
      );
      await mystikoContract.rollup(proofA, proofB, proofC, `${rollupSize}`, newRoot, leafHash, {
        from: accounts[0],
        gas: estimateGas,
      });
      expect((await mystikoContract.depositIncludedCount()).toNumber()).to.equal(
        depositIncludedCount + rollupSize,
      );
      expect((await mystikoContract.currentRoot()).toString()).to.equal(newRoot);
      expect((await mystikoContract.currentRootIndex()).toNumber()).to.equal(
        (currentRootIndex + 1) % rootHistoryLength,
      );
      expect(await mystikoContract.isKnownRoot(newRoot)).to.equal(true);
      expect((await mystikoContract.depositQueueSize()).toNumber()).to.equal(depositQueueSize - rollupSize);
    });
  });
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
