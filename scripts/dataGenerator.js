import fs from 'fs';
import mystiko from '../src/index.js';
import { BridgeType, DepositStatus, PrivateNoteStatus } from '../src/model';

require('dotenv').config();

async function createDeposit() {
  mystiko.signers.privateKey.setPrivateKey(process.env.PRIVATE_KEY);
  const accounts = mystiko.accounts.getAccounts();
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const depositCount = mystiko.deposits.getDepositsCount(
      (deposit) => account.shieldedAddress === deposit.shieldedRecipientAddress,
    );
    for (let j = 0; j < 4 - Math.floor(depositCount / 4); j++) {
      let request = {
        srcChainId: 3,
        dstChainId: 3,
        assetSymbol: 'ETH',
        bridge: BridgeType.LOOP,
        amount: parseFloat((Math.random() / 1000).toFixed(8)),
        shieldedAddress: account.shieldedAddress,
      };
      let ret = await mystiko.deposits.createDeposit(request, mystiko.signers.privateKey);
      await ret.depositPromise;
      request = {
        srcChainId: 97,
        dstChainId: 97,
        assetSymbol: 'BNB',
        bridge: BridgeType.LOOP,
        amount: parseFloat((Math.random() / 1000).toFixed(8)),
        shieldedAddress: account.shieldedAddress,
      };
      ret = await mystiko.deposits.createDeposit(request, mystiko.signers.privateKey);
      await ret.depositPromise;
      request = {
        srcChainId: 3,
        dstChainId: 3,
        assetSymbol: 'MTT',
        bridge: BridgeType.LOOP,
        amount: parseFloat((Math.random() * 10).toFixed(8)),
        shieldedAddress: account.shieldedAddress,
      };
      ret = await mystiko.deposits.createDeposit(request, mystiko.signers.privateKey);
      await ret.depositPromise;
      request = {
        srcChainId: 3,
        dstChainId: 3,
        assetSymbol: 'MTT',
        bridge: BridgeType.LOOP,
        amount: parseFloat((Math.random() * 10).toFixed(8)),
        shieldedAddress: account.shieldedAddress,
      };
      ret = await mystiko.deposits.createDeposit(request, mystiko.signers.privateKey);
      await ret.depositPromise;
    }
  }
}

async function createWithdraw() {
  mystiko.signers.privateKey.setPrivateKey(process.env.PRIVATE_KEY);
  const address = (await mystiko.signers.privateKey.accounts())[0];
  const accounts = mystiko.accounts.getAccounts();
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const privateNotes = mystiko.notes.getPrivateNotes({
      filterFunc: (note) => note.shieldedAddress === account.shieldedAddress,
    });
    for (let j = 0; j < privateNotes.length; j++) {
      const privateNote = privateNotes[j];
      if (privateNote.status === PrivateNoteStatus.IMPORTED) {
        const deposit = mystiko.deposits.getDeposit(privateNote.srcTransactionHash);
        if (deposit.status === DepositStatus.SUCCEEDED) {
          const { withdrawPromise } = await mystiko.withdraws.createWithdraw(
            process.env.WALLET_PASSWORD,
            { privateNote, recipientAddress: address },
            mystiko.signers.privateKey,
          );
          await withdrawPromise;
        }
      }
    }
  }
}

async function main() {
  if (process.argv.length <= 2) {
    throw new Error('Usage dataGenerator.js [OUTPUT_FILE_PATH]');
  }
  if (!process.env.PRIVATE_KEY) {
    throw new Error('environment PRIVATE_KEY not set');
  }
  if (!process.env.WALLET_PASSWORD) {
    throw new Error('environment WALLET_PASSWORD not set');
  }
  if (!process.env.WALLET_SEED) {
    throw new Error('environment WALLET_SEED not set');
  }
  const outPutFile = process.argv[2];
  await mystiko.initialize();
  if (!mystiko.wallets.getCurrentWallet()) {
    await mystiko.wallets.createWallet(process.env.WALLET_SEED, process.env.WALLET_PASSWORD);
  }
  const accountCount = mystiko.accounts.getAccounts().length;
  for (let i = 0; i < 10 - accountCount; i++) {
    await mystiko.accounts.addAccount(process.env.WALLET_PASSWORD, `Account #${i}`);
  }
  //await createDeposit();
  await createWithdraw();
  fs.writeFileSync(outPutFile, mystiko.db.exportDataAsString(mystiko.db));
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
