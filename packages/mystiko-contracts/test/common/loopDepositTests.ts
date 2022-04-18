import { expect } from 'chai';
import { Wallet } from '@ethersproject/wallet';
import { DummySanctionsList, TestToken } from '@mystikonetwork/contracts-abi';
import { CommitmentV1, MystikoProtocolV2 } from '@mystikonetwork/protocol';
import { toHex, toBN } from '@mystikonetwork/utils';
import { CommitmentInfo } from './commitment';
import { MinAmount } from '../util/constants';

const { waffle } = require('hardhat');

export function testLoopDeposit(
  contractName: string,
  protocol: MystikoProtocolV2,
  mystikoContract: any,
  commitmentPoolContract: any,
  testTokenContract: TestToken,
  sanctionList: DummySanctionsList,
  accounts: Wallet[],
  depositAmount: string,
  isMainAsset: boolean,
  cmInfo: CommitmentInfo<CommitmentV1>,
) {
  let minTotalAmount: string;
  let minRollupFee: number;
  const { commitments } = cmInfo;
  const numOfCommitments = commitments.length;
  let expectBalance: string;

  describe(`Test ${contractName} deposit operations`, () => {
    before(async () => {
      minRollupFee = (await mystikoContract.minRollupFee()).toString();
      minTotalAmount = toBN(depositAmount).add(toBN(minRollupFee)).toString();
    });

    it('should revert when deposit is disabled', async () => {
      await mystikoContract.toggleDeposits(true);
      await expect(
        mystikoContract.deposit(
          [
            depositAmount,
            commitments[0].commitmentHash.toString(),
            commitments[0].k.toString(),
            commitments[0].randomS.toString(),
            toHex(commitments[0].privateNote),
            minRollupFee,
          ],
          { from: accounts[0].address, value: isMainAsset ? minTotalAmount : '0' },
        ),
      ).to.be.revertedWith('deposits are disabled');
      await mystikoContract.toggleDeposits(false);
    });

    it('should revert when sender in sanction list', async () => {
      await sanctionList.setSanction(accounts[0].address);
      await expect(
        mystikoContract.deposit(
          [
            depositAmount,
            commitments[0].commitmentHash.toString(),
            commitments[0].k.toString(),
            commitments[0].randomS.toString(),
            toHex(commitments[0].privateNote),
            minRollupFee,
          ],
          { from: accounts[0].address, value: isMainAsset ? minTotalAmount : '0' },
        ),
      ).to.be.revertedWith('sanctioned address');
      await sanctionList.setSanction('0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF');
    });

    it('should revert when amount is too few', async () => {
      const amount = toBN(MinAmount).sub(toBN(1)).toString();
      await expect(
        mystikoContract.deposit(
          [
            amount,
            commitments[0].commitmentHash.toString(),
            commitments[0].k.toString(),
            commitments[0].randomS.toString(),
            toHex(commitments[0].privateNote),
            '0',
          ],
          { from: accounts[0].address, value: isMainAsset ? amount : '0' },
        ),
      ).to.be.revertedWith('amount too few');
    });

    it('should revert when amount is too few', async () => {
      const amount = toBN(MinAmount).sub(toBN(1)).toString();
      await expect(
        mystikoContract.deposit(
          [
            amount,
            commitments[0].commitmentHash.toString(),
            commitments[0].k.toString(),
            commitments[0].randomS.toString(),
            toHex(commitments[0].privateNote),
            '0',
          ],
          { from: accounts[0].address, value: isMainAsset ? amount : '0' },
        ),
      ).to.be.revertedWith('amount too few');
    });

    it('should revert when rollup fee is too few', async () => {
      await expect(
        mystikoContract.deposit(
          [
            depositAmount,
            commitments[0].commitmentHash.toString(),
            commitments[0].k.toString(),
            commitments[0].randomS.toString(),
            toHex(commitments[0].privateNote),
            '0',
          ],
          { from: accounts[0].address, value: isMainAsset ? minTotalAmount : '0' },
        ),
      ).to.be.revertedWith('rollup fee too few');
    });

    it('should revert when commitmentHash is incorrect', async () => {
      await expect(
        mystikoContract.deposit(
          [
            depositAmount,
            commitments[0].commitmentHash.toString(),
            protocol.randomBigInt().toString(),
            commitments[0].randomS.toString(),
            toHex(commitments[0].privateNote),
            minRollupFee,
          ],
          { from: accounts[0].address, value: isMainAsset ? minTotalAmount : '0' },
        ),
      ).to.be.revertedWith('commitment hash incorrect');
    });

    it('should approve asset successfully', async () => {
      if (!isMainAsset) {
        const approveAmount = toBN(minTotalAmount).muln(commitments.length).toString();
        await testTokenContract.approve(mystikoContract.address, approveAmount, {
          from: accounts[0].address,
        });
      }
    });

    it('should deposit successfully', async () => {
      for (let i = 0; i < numOfCommitments; i += 1) {
        await expect(
          mystikoContract.deposit(
            [
              depositAmount,
              commitments[i].commitmentHash.toString(),
              commitments[i].k.toString(),
              commitments[i].randomS.toString(),
              toHex(commitments[i].privateNote),
              minRollupFee,
            ],
            { from: accounts[0].address, value: isMainAsset ? minTotalAmount : '0' },
          ),
        )
          .to.emit(commitmentPoolContract, 'CommitmentQueued')
          .withArgs(
            commitments[i].commitmentHash.toString(),
            minRollupFee,
            `${i}`,
            toHex(commitments[i].privateNote),
          );

        expect(
          await commitmentPoolContract.historicCommitments(commitments[i].commitmentHash.toString()),
        ).to.equal(true);
        expect((await commitmentPoolContract.commitmentQueue(`${i}`)).commitment.toString()).to.equal(
          commitments[i].commitmentHash.toString(),
        );
        expect((await commitmentPoolContract.commitmentQueue(`${i}`)).rollupFee.toString()).to.equal(
          minRollupFee,
        );
      }
      expect((await commitmentPoolContract.commitmentQueueSize()).toString()).to.equal(
        `${commitments.length}`,
      );
    });

    it('should have correct balance', async () => {
      expectBalance = toBN(minTotalAmount).muln(numOfCommitments).toString();
      if (isMainAsset) {
        expect(await waffle.provider.getBalance(mystikoContract.address)).to.equal('0');
        expect(await waffle.provider.getBalance(commitmentPoolContract.address)).to.equal(expectBalance);
      } else {
        expect((await testTokenContract.balanceOf(mystikoContract.address)).toString()).to.equal('0');
        expect((await testTokenContract.balanceOf(commitmentPoolContract.address)).toString()).to.equal(
          expectBalance,
        );
      }
    });

    it('should approve asset successfully', async () => {
      if (!isMainAsset) {
        const approveAmount = toBN(minTotalAmount).muln(commitments.length).toString();
        await testTokenContract.approve(mystikoContract.address, approveAmount, {
          from: accounts[0].address,
        });
      }
    });

    it('should revert with duplicate commitment', async () => {
      await expect(
        mystikoContract.deposit(
          [
            depositAmount,
            commitments[0].commitmentHash.toString(),
            commitments[0].k.toString(),
            commitments[0].randomS.toString(),
            toHex(commitments[0].privateNote),
            minRollupFee,
          ],
          { from: accounts[0].address, value: isMainAsset ? minTotalAmount : '0' },
        ),
      ).to.be.revertedWith('the commitment has been submitted');
    });

    it('should have correct balance', async () => {
      if (isMainAsset) {
        expect(await waffle.provider.getBalance(mystikoContract.address)).to.equal('0');
        expect(await waffle.provider.getBalance(commitmentPoolContract.address)).to.equal(expectBalance);
      } else {
        expect((await testTokenContract.balanceOf(mystikoContract.address)).toString()).to.equal('0');
        expect((await testTokenContract.balanceOf(commitmentPoolContract.address)).toString()).to.equal(
          expectBalance,
        );
      }
    });
  });
}
