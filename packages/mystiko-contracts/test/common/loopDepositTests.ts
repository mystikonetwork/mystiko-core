import { expect } from 'chai';
import { Wallet } from '@ethersproject/wallet';
import { TestToken } from '@mystikonetwork/contracts-abi';
import { CommitmentV1, MystikoProtocolV2 } from '@mystikonetwork/protocol';
import { toHex, toBN } from '@mystikonetwork/utils';
import { CommitmentInfo } from './commitment';

const { waffle } = require('hardhat');

export function testLoopDeposit(
  contractName: string,
  protocol: MystikoProtocolV2,
  mystikoContract: any,
  mystikoContractLimit: any,
  testTokenContract: TestToken,
  accounts: Wallet[],
  depositAmount: string,
  isMainAsset: boolean,
  cmInfo: CommitmentInfo<CommitmentV1>,
) {
  let minTotalAmount: string;
  let minRollupFee: number;
  const { commitments } = cmInfo;
  const { mystikoAddress } = cmInfo;
  const numOfCommitments = commitments.length;

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
          .to.emit(mystikoContract, 'CommitmentQueued')
          .withArgs(
            commitments[i].commitmentHash.toString(),
            minRollupFee,
            `${i}`,
            toHex(commitments[i].privateNote),
          );

        expect(await mystikoContract.historicCommitments(commitments[i].commitmentHash.toString())).to.equal(
          true,
        );
        expect((await mystikoContract.commitmentQueue(`${i}`)).commitment.toString()).to.equal(
          commitments[i].commitmentHash.toString(),
        );
        expect((await mystikoContract.commitmentQueue(`${i}`)).rollupFee.toString()).to.equal(minRollupFee);
      }
      expect((await mystikoContract.commitmentQueueSize()).toString()).to.equal(`${commitments.length}`);
    });

    it('should have correct balance', async () => {
      const expectBalance = toBN(minTotalAmount).muln(numOfCommitments).toString();
      if (isMainAsset) {
        expect(await waffle.provider.getBalance(mystikoContract.address)).to.equal(expectBalance);
      } else {
        expect((await testTokenContract.balanceOf(mystikoContract.address)).toString()).to.equal(
          expectBalance,
        );
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

    it('should revert when tree is full', async () => {
      if (!isMainAsset) {
        const approveAmount = toBN(minTotalAmount).muln(3);
        await testTokenContract.approve(mystikoContractLimit.address, approveAmount.toString(), {
          from: accounts[0].address,
        });
      }
      for (let i = 0; i < 2; i += 1) {
        const commitment = await protocol.commitmentWithShieldedAddress(mystikoAddress, toBN(depositAmount));
        await mystikoContractLimit.deposit(
          [
            depositAmount,
            commitment.commitmentHash.toString(),
            commitment.k.toString(),
            commitment.randomS.toString(),
            toHex(commitment.privateNote),
            minRollupFee,
          ],
          { from: accounts[0].address, value: isMainAsset ? minTotalAmount : '0' },
        );
      }

      const commitment = await protocol.commitmentWithShieldedAddress(mystikoAddress, toBN(depositAmount));
      await expect(
        mystikoContractLimit.deposit(
          [
            depositAmount,
            commitment.commitmentHash.toString(),
            commitment.k.toString(),
            commitment.randomS.toString(),
            toHex(commitment.privateNote),
            minRollupFee,
          ],
          { from: accounts[0].address, value: isMainAsset ? minTotalAmount : '0' },
        ),
      ).to.be.revertedWith('tree is full');
    });
  });
}
