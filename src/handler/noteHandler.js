import { ethers } from 'ethers';
import BN from 'bn.js';
import { Handler } from './handler.js';
import { WalletHandler } from './walletHandler.js';
import { AccountHandler } from './accountHandler.js';
import { check, readJsonFile, toBuff, toHexNoPrefix } from '../utils.js';
import { isValidPrivateNoteStatus, OffChainNote, PrivateNote, PrivateNoteStatus } from '../model/note.js';
import { ProviderPool } from '../chain/provider.js';
import { BridgeType } from '../config/contractConfig.js';
import { ID_KEY } from '../model/common.js';

export class NoteHandler extends Handler {
  constructor(walletHandler, accountHandler, providerPool, db, config) {
    super(db, config);
    check(walletHandler instanceof WalletHandler, 'walletHandler should be instance of WalletHandler');
    check(accountHandler instanceof AccountHandler, 'accountHandler should be instance of AccountHandler');
    check(providerPool instanceof ProviderPool, 'providerPool should be instance of ProviderPool');
    this.walletHandler = walletHandler;
    this.accountHandler = accountHandler;
    this.providerPool = providerPool;
  }

  async importFromOffChainNote(walletPassword, offChainNote) {
    this.walletHandler.checkPassword(walletPassword);
    const wallet = this.walletHandler.getCurrentWallet();
    if (typeof offChainNote === 'string') {
      offChainNote = new OffChainNote(JSON.parse(offChainNote));
    } else {
      check(offChainNote instanceof OffChainNote, 'offChainNote should be instance of OffChainNote');
    }
    const chainConfig = this.config.getChainConfig(offChainNote.chainId);
    const provider = this.providerPool.getProvider(offChainNote.chainId);
    const txReceipt = await provider.getTransactionReceipt(offChainNote.transactionHash);
    check(txReceipt, `${offChainNote.transactionHash} does not exist or not confirmed`);
    const contractConfig = chainConfig.getContract(txReceipt.to);
    const parsedEvents = await this._parseDepositLog(offChainNote, txReceipt, contractConfig);
    check(parsedEvents['Deposit'], 'no deposit event in transaction logs');
    const { amount, commitmentHash, encryptedNote } = parsedEvents['Deposit'].args;
    const shieldedAddress = await this._tryDecryptOnChainNote(walletPassword, encryptedNote);
    check(shieldedAddress, 'this deposit does not belong to your accounts');
    const privateNote = new PrivateNote();
    privateNote.srcChainId = offChainNote.chainId;
    privateNote.srcTransactionHash = offChainNote.transactionHash;
    privateNote.srcToken = contractConfig.assetSymbol;
    privateNote.srcTokenAddress = contractConfig.assetAddress;
    privateNote.srcProtocolAddress = txReceipt.to;
    privateNote.amount = new BN(amount.toString());
    privateNote.bridge = contractConfig.bridgeType;
    if (contractConfig.bridgeType !== BridgeType.LOOP) {
      const peerChainConfig = this.config.getChainConfig(contractConfig.peerChainId);
      const peerContractConfig = peerChainConfig.getContract(contractConfig.peerContractAddress);
      privateNote.dstChainId = contractConfig.peerChainId;
      privateNote.dstToken = peerContractConfig.assetSymbol;
      privateNote.dstTokenAddress = peerContractConfig.assetAddress;
      privateNote.dstProtocolAddress = contractConfig.peerContractAddress;
    } else {
      privateNote.dstChainId = offChainNote.chainId;
      privateNote.dstTransactionHash = offChainNote.transactionHash;
      privateNote.dstToken = contractConfig.assetSymbol;
      privateNote.dstTokenAddress = contractConfig.assetAddress;
      privateNote.dstProtocolAddress = txReceipt.to;
    }
    privateNote.commitmentHash = new BN(toHexNoPrefix(commitmentHash), 16);
    privateNote.encryptedOnChainNote = toBuff(encryptedNote);
    privateNote.walletId = wallet.id;
    privateNote.shieldedAddress = shieldedAddress;
    privateNote.status = PrivateNoteStatus.IMPORTED;
    const existingOne = this.db.notes.findOne({
      srcChainId: privateNote.srcChainId,
      commitmentHash: privateNote.commitmentHash.toString(),
    });
    check(!existingOne, 'duplicate notes');
    this.db.notes.insert(privateNote.data);
    await this.saveDatabase();
    return privateNote;
  }

  getPrivateNote(query) {
    let privateNote;
    if (typeof query === 'number') {
      privateNote = this.db.notes.findOne({ [ID_KEY]: query });
    } else if (typeof query === 'string') {
      privateNote = this.db.notes.findOne({ srcTransactionHash: query });
      if (!privateNote) {
        privateNote = this.db.notes.findOne({ dstTransactionHash: query });
      }
      if (!privateNote) {
        privateNote = this.db.notes.findOne({ commitmentHash: query });
      }
      if (!privateNote) {
        privateNote = this.db.notes.findOne({ encryptedOnChainNote: query });
      }
    } else if (query instanceof PrivateNote) {
      return query;
    }
    return privateNote ? new PrivateNote(privateNote) : undefined;
  }

  getPrivateNotes({ filterFunc, sortBy, desc, offset, limit } = {}) {
    const wallet = this.walletHandler.checkCurrentWallet();
    const whereClause = (rawObject) => {
      if (filterFunc && filterFunc instanceof Function) {
        return rawObject.walletId === wallet.id && filterFunc(new PrivateNote(rawObject));
      }
      return rawObject.walletId === wallet.id;
    };
    let queryChain = this.db.notes.chain().where(whereClause);
    if (sortBy && typeof sortBy === 'string') {
      queryChain = queryChain.simplesort(sortBy, desc ? desc : false);
    }
    if (offset && typeof offset === 'number') {
      queryChain = queryChain.offset(offset);
    }
    if (limit && typeof limit === 'number') {
      queryChain = queryChain.limit(limit);
    }
    return queryChain.data().map((rawObject) => new PrivateNote(rawObject));
  }

  async _parseDepositLog(offChainNote, txReceipt, contractConfig) {
    check(contractConfig, `can't recognize contract address ${txReceipt.to}`);
    const contract = new ethers.utils.Interface(contractConfig.abi);
    const parsedEvents = {};
    for (let i = 0; i < txReceipt.logs.length; i++) {
      try {
        const parsedEvent = contract.parseLog(txReceipt.logs[i]);
        parsedEvents[parsedEvent.name] = parsedEvent;
      } catch {
        // do nothing
      }
    }
    return parsedEvents;
  }

  async _tryDecryptOnChainNote(password, encryptedOnChainNote) {
    const accounts = this.accountHandler.getAccounts();
    for (let i = 0; i < accounts.length; i++) {
      const skEnc = this.protocol.decryptSymmetric(password, accounts[i].encryptedEncSecretKey);
      try {
        await this.protocol.decryptAsymmetric(toBuff(skEnc), toBuff(encryptedOnChainNote));
        return accounts[i].shieldedAddress;
      } catch {
        // do nothing
      }
    }
    return undefined;
  }

  async _updateStatus(privateNote, status) {
    check(privateNote instanceof PrivateNote, 'privateNote should be instance of PrivateNote');
    check(isValidPrivateNoteStatus(status), 'invalid private note status');
    privateNote.status = status;
    this.db.notes.update(privateNote.data);
    await this.saveDatabase();
    return privateNote;
  }
}
