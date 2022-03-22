import mystiko, {
  DepositParams,
  DepositStatus,
  PrivateKeySigner,
  PrivateNote,
  WithdrawParams,
  WithdrawStatus,
} from '@mystikonetwork/client';
import { BridgeType, ChainConfig, ContractConfig } from '@mystikonetwork/config';

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
const defaultBridgeType: string = 'Loop';

function parseArgsParameters(arg: string): string | undefined {
  const args = process.argv;
  const match = new RegExp(`^--${arg}=(.*)$`);

  for (let i = 0; i <= args.length; i += 1) {
    const arr = match.exec(args[i]);
    if (arr !== null) {
      return arr[1];
    }
  }

  return undefined;
}

function filterContracts(cs: ContractConfig): ContractConfig | undefined {
  const contracts = parseArgsParameters('contracts');
  let bridge = parseArgsParameters('bridge');
  if (bridge === undefined || bridge === '') {
    bridge = defaultBridgeType;
  }
  if (cs.name.startsWith(`MystikoWith${bridge}`)) {
    if (contracts === undefined || contracts === '') {
      return cs;
    }
    const contractList = contracts.split(',');
    if (contractList.includes(cs.assetSymbol)) {
      return cs;
    }
  }

  return undefined;
}

function getBridgeTypeEnum(bd: string): BridgeType | undefined {
  const match = /^MystikoWith(.*)(ERC20|Main)$/;
  const rep = match.exec(bd);
  if (rep === null) {
    return undefined;
  }
  switch (rep[1]) {
    case 'Loop': {
      return BridgeType.LOOP;
    }
    case 'TBridge': {
      return BridgeType.TBRIDGE;
    }
    case 'Celer': {
      return BridgeType.CELER;
    }
    case 'Poly': {
      return BridgeType.POLY;
    }
    default: {
      return undefined;
    }
  }
}

describe('Integration test for verify deployed contract', async () => {
  before(() => {
    expect(process.env.PRIVATE_KEY).to.not.an('undefined', 'private key not found');
  });

  await mystiko.initialize({ dbAdapter: undefined });
  const network = parseArgsParameters('network');
  configChains =
    network === undefined || network === ''
      ? mystiko.config?.chains
      : mystiko.config?.chains.filter((chain: ChainConfig) => chain.name === network);

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
    configChains?.forEach((chain: ChainConfig) => {
      describe(`${chain.name} should deposit and withdraw successful`, () => {
        const allContract = chain.contracts;
        allContract.filter(filterContracts).forEach((contract: ContractConfig) => {
          let recipientAddress: string | undefined;

          it(`[${chain.name}] ${contract.name} ${contract.assetSymbol} should deposit successful`, async () => {
            const bridge: BridgeType | undefined = getBridgeTypeEnum(contract.name);
            expect(bridge).to.not.an('undefined');
            let dstChainId: number;
            if (contract.peerChainId !== undefined) {
              dstChainId = contract.peerChainId;
            } else {
              dstChainId = chain.chainId;
            }
            const depositRequest: DepositParams = {
              srcChainId: chain.chainId,
              dstChainId,
              assetSymbol: contract.assetSymbol,
              bridge: bridge as BridgeType,
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
            if (bridge === BridgeType.LOOP) {
              expect(deposit1?.status).to.equal(DepositStatus.SUCCEEDED);
            } else {
              expect(deposit1?.status).to.equal(DepositStatus.SRC_CONFIRMED);
            }
            privateNote = mystiko.notes?.getPrivateNote(depositResponse?.deposit.id as number);
            recipientAddress = deposit1?.srcAddress;
          });

          it(`[${chain.name}] ${contract.name} ${contract.assetSymbol} should withdraw successful`, async () => {
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
