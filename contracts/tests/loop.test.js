import { BN } from 'bn.js';
import { toDecimals } from '../../src/utils.js';
import { computeCommitment } from '../../src/protocol.js';
import * as utils from '../../src/utils.js';
import MerkleTree from 'fixed-merkle-tree';

const MystikoWithLoop = artifacts.require('MystikoWithLoop');
const TestToken = artifacts.require('TestToken');
const Verifier = artifacts.require('Verifier');
const Hasher = artifacts.require('Hasher');

contract('MystikoWithLoop', (accounts) => {
  describe('Test basic read operations', () => {
    it('should set token correctly information correctly', async () => {
      const tokenContract = await TestToken.deployed();
      const loopContract = await MystikoWithLoop.deployed();
      expect(await loopContract.getToken.call()).to.equal(tokenContract.address);
      expect(await loopContract.getTokenName.call()).to.equal(await tokenContract.name.call());
      expect(await loopContract.getTokenSymbol.call()).to.equal(await tokenContract.symbol.call());
      const actualDecimals = (await loopContract.getTokenDecimals.call()).toString();
      const expectedDecimals = (await tokenContract.decimals.call()).toString();
      expect(actualDecimals).to.equal(expectedDecimals);
    });

    it('should set verifier information correctly', async () => {
      const loopContract = await MystikoWithLoop.deployed();
      const verifierContract = await Verifier.deployed();
      expect(await loopContract.getVerifierAddress.call()).to.equal(verifierContract.address);
    });

    it('should set hasher information correctly', async () => {
      const loopContract = await MystikoWithLoop.deployed();
      const hasherContract = await Hasher.deployed();
      expect(await loopContract.getHasherAddress.call()).to.equal(hasherContract.address);
    });

    it('should have enough tokens in account 0', async () => {
      const tokenContract = await TestToken.deployed();
      const balanceOfAccount0 = await tokenContract.balanceOf.call(accounts[0]);
      expect(balanceOfAccount0.eq(toDecimals(1000000000, 18))).to.equal(true);
    });
  });

  describe('Test deposit operation', () => {
    it('should transfer token to account 1 correctly', async () => {
      const tokenContract = await TestToken.deployed();
      await tokenContract.transfer(accounts[1], toDecimals(1000, 18), { from: accounts[0] });
      const balanceOfAccount1 = await tokenContract.balanceOf.call(accounts[1]);
      expect(balanceOfAccount1.eq(toDecimals(1000, 18))).to.equal(true);
    });

    it('should deposit successfully', async () => {
      const verifyPk = '290bf80ac0b831e4401775abc4af18b437a9e39b167c6867d456ea60cc902900';
      const encPk = '03d28c79e8f5b70e86403e8343acb054fcd9a9966168cb0789d892d29969bc18bb';
      const { commitment, encryptedNote } = computeCommitment(verifyPk, encPk, 500, 18);
      const loopContract = await MystikoWithLoop.deployed();
      const tokenContract = await TestToken.deployed();
      const amount = toDecimals(1000, 18);
      await tokenContract.approve(loopContract.address, amount, { from: accounts[1] });
      const allowance = await tokenContract.allowance(accounts[1], loopContract.address);
      expect(allowance.eq(amount)).to.equal(true);
      const gasEstimated = await loopContract.deposit.estimateGas(
        amount,
        utils.toFixedLenHex(commitment),
        utils.toHex(encryptedNote),
        { from: accounts[1] },
      );
      const tx = await loopContract.deposit(
        amount,
        utils.toFixedLenHex(commitment),
        utils.toHex(encryptedNote),
        {
          from: accounts[1],
          gas: gasEstimated,
        },
      );
      const depositEvent = tx.logs.find((e) => e['event'] === 'Deposit');
      expect(depositEvent).to.not.equal(undefined);
      expect(depositEvent.args.amount.eq(amount)).to.equal(true);
      expect(depositEvent.args.commitmentHash).to.equal(utils.toFixedLenHex(commitment));
      expect(depositEvent.args.encryptedNote).to.equal(utils.toHex(encryptedNote));
      const merkleTreeInsertEvent = tx.logs.find((e) => e['event'] === 'MerkleTreeInsert');
      expect(merkleTreeInsertEvent).to.not.equal(undefined);
      expect(merkleTreeInsertEvent.args.amount.eq(amount)).to.equal(true);
      expect(merkleTreeInsertEvent.args.leaf).to.equal(utils.toFixedLenHex(commitment));
      expect(merkleTreeInsertEvent.args.leafIndex.eq(new BN(0))).to.equal(true);
      const levels = await loopContract.getLevels.call();
      const tree = new MerkleTree(levels, [merkleTreeInsertEvent.args.leaf]);
      const root = new BN(tree.root());
      const isKnownRoot = await loopContract.isKnownRoot.call(utils.toFixedLenHex(root));
      expect(isKnownRoot).to.equal(true);
    });
  });
});
