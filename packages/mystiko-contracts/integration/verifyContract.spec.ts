import mystiko, {
  DepositParams,
  DepositStatus,
  PrivateKeySigner,
  PrivateNote,
  WithdrawParams,
  WithdrawStatus,
} from '@mystiko/client';
import { ChainConfig } from '@mystiko/config';

require('dotenv').config();

const chai = require('chai');

const { expect } = chai;

let signer: PrivateKeySigner | undefined;
let privateNote: PrivateNote | undefined;
let shieldedAddress: string | undefined;
let configChains: ChainConfig[] | undefined;
const walletMasterSeed: string = 'integration@seed';
const walletPassword: string = 'integration@psd';
const accountName: string = 'integration@test';
const depositAmount: number = 0.1;

describe('Integration test for verify deployed contract', async () => {
  before(() => {
    expect(process.env.PRIVATE_KEY).to.not.an('undefined', 'private key not found');
  });

  await mystiko.initialize({ dbAdapter: undefined });
  configChains = mystiko.config?.chains;

  describe('Make Mystiko ready', () => {
    it('should initialize mystiko successful', () => {
      expect(mystiko.wallets).to.not.an('undefined');
      expect(mystiko.accounts).to.not.an('undefined');
      expect(mystiko.deposits).to.not.an('undefined');
      expect(mystiko.contracts).to.not.an('undefined');
      expect(mystiko.withdraws).to.not.an('undefined');
      expect(mystiko.signers).to.not.an('undefined');
    });

    it('should create wallet successful', async () => {
      expect(mystiko.wallets?.getCurrentWallet()).to.be.an('undefined');
      await mystiko.wallets?.createWallet(walletMasterSeed, walletPassword);
      expect(mystiko.wallets?.getCurrentWallet()).to.not.an('undefined');
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(mystiko.wallets?.checkPassword(walletPassword)).to.be.true;
    });

    it('should create account and set private-key successful', async () => {
      expect(mystiko.accounts?.getAccounts().length).to.equal(0);
      await mystiko.accounts?.addAccount(walletPassword, accountName);
      expect(mystiko.accounts?.getAccounts().length).to.equal(1);
      shieldedAddress = mystiko.accounts?.getAccount(1)?.shieldedAddress;
      mystiko.signers?.privateKey.setPrivateKey(process.env.PRIVATE_KEY as string);
      signer = mystiko.signers?.privateKey;
    });
  });

  describe('Loop config to deposit and withdraw', () => {
    configChains?.forEach((chain) => {
      describe(`${chain.name} should deposit and withdraw successful`, () => {
        const allContract = chain.contracts;
        allContract
          .filter((c) => c.name.startsWith('MystikoWithLoop'))
          .forEach((contract) => {
            let recipientAddress: string | undefined;

            it(`[${chain.name}] ${contract.name} ${contract.assetSymbol} shoud deposit successful`, async () => {
              const depositRequest: DepositParams = {
                srcChainId: chain.chainId,
                dstChainId: chain.chainId,
                assetSymbol: contract.assetSymbol,
                bridge: mystiko.models.BridgeType.LOOP,
                amount: depositAmount,
                shieldedAddress: shieldedAddress as string,
              };
              const depositResponse = await mystiko.deposits?.createDeposit(
                depositRequest,
                signer as PrivateKeySigner,
              );
              await depositResponse?.depositPromise;
              const deposit1 = mystiko.deposits?.getDeposit(depositResponse?.deposit.id as number);
              expect(deposit1?.errorMessage).to.be.an('undefined');
              expect(deposit1?.status).to.equal(DepositStatus.SUCCEEDED);
              privateNote = mystiko.notes?.getPrivateNote(depositResponse?.deposit.id as number);
              recipientAddress = deposit1?.srcAddress;
            });

            it(`[${chain.name}] ${contract.name} ${contract.assetSymbol} shoud withdraw successful`, async () => {
              const withdrawRequest: WithdrawParams = {
                privateNote: privateNote as PrivateNote,
                recipientAddress: recipientAddress as string,
              };
              const withdrawResponse = await mystiko.withdraws?.createWithdraw(
                walletPassword,
                withdrawRequest,
                signer as PrivateKeySigner,
              );
              await withdrawResponse?.withdrawPromise;
              const withdraw1 = mystiko.withdraws?.getWithdraw(withdrawResponse?.withdraw.id as number);
              expect(withdraw1?.errorMessage).to.be.an('undefined');
              expect(withdraw1?.status).to.equal(WithdrawStatus.SUCCEEDED);
            });
          });
      });
    });
  });

  run();
});
