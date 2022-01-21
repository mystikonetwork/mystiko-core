import BN from 'bn.js';
import { ethers } from 'ethers';
import { DepositHandler } from '../../src/handler/depositHandler.js';
import { ProviderPool } from '../../src/chain/provider.js';
import { ContractPool } from '../../src/chain/contract.js';
import { createDatabase } from '../../src/database';
import { WalletHandler } from '../../src/handler/walletHandler.js';
import { BaseSigner } from '../../src/chain/signer.js';
import { toDecimals, toHex } from '../../src/utils.js';
import { BridgeType, readFromFile } from '../../src/config';
import { DepositStatus } from '../../src/model/deposit';
import { MystikoABI } from '../../src/chain/abi.js';

class MockTransactionResponse {
  constructor(errorMessage = undefined) {
    this.errorMessage = errorMessage;
    this.hash = toHex(ethers.utils.randomBytes(32));
  }
  wait() {
    return new Promise((resolve, reject) => {
      if (!this.errorMessage) {
        resolve({ transactionHash: this.hash });
      } else {
        reject(this.errorMessage);
      }
    });
  }
}

class MockERC20Contract extends ethers.Contract {
  constructor(address, abi, defaultOwner) {
    super(address, abi);
    this._allowance = { [defaultOwner]: {} };
    this.defaultOwner = defaultOwner;
    this.approveCount = 0;
  }

  connect(providerOrSigner) {
    expect(providerOrSigner).not.toBe(undefined);
    return this;
  }

  allowance(owner, spender) {
    return new Promise((resolve) => {
      if (this._allowance[owner] && this._allowance[owner][spender]) {
        resolve(this._allowance[owner][spender]);
      } else {
        resolve(new BN(0));
      }
    });
  }

  decimals() {
    return new Promise((resolve) => resolve(18));
  }

  approve(spender, amount) {
    return new Promise((resolve) => {
      this._allowance[this.defaultOwner][spender] = new BN(amount);
      this.approveCount = this.approveCount + 1;
      this.tx = new MockTransactionResponse();
      resolve(this.tx);
    });
  }
}

class MockMystikoContract extends ethers.Contract {
  constructor(address, abi, providerOrSigner, errorMessage = undefined) {
    super(address, abi, providerOrSigner);
    this.errorMessage = errorMessage;
  }

  connect(providerOrSigner) {
    expect(providerOrSigner).not.toBe(undefined);
    return this;
  }

  deposit(amount, commitmentHash, hashK, randomS, privateNote, params) {
    const numberPattern = /^[0-9]*$/;
    expect(typeof amount === 'string' && amount.match(numberPattern)).not.toBe(null);
    expect(
      typeof commitmentHash === 'string' && commitmentHash.startsWith('0x') && commitmentHash.length === 66,
    );
    expect(typeof hashK === 'string' && hashK.startsWith('0x') && hashK.length === 66);
    expect(typeof randomS === 'string' && randomS.startsWith('0x') && randomS.length === 66);
    expect(typeof privateNote === 'string' && privateNote.startsWith('0x'));
    expect(amount).toBe(params.value);
    return new Promise((resolve, reject) => {
      if (this.errorMessage) {
        reject(this.errorMessage);
      } else {
        this.tx = new MockTransactionResponse();
        resolve(this.tx);
      }
    });
  }
}

class MockSigner extends BaseSigner {
  constructor(conf, expectedAddress, expectedChainId) {
    super(conf);
    this.expectedAddress = expectedAddress;
    this.expectedChainId = expectedChainId;
  }

  async connected() {
    return await new Promise((resolve) => resolve(true));
  }

  get signer() {
    return {
      getAddress: () => {
        return new Promise((resolve) => resolve(this.expectedAddress));
      },
    };
  }

  async chainId() {
    return await new Promise((resolve) => resolve(toHex(this.expectedChainId)));
  }
}

let db;
let conf;
let providerPool;
let contractPool;
let walletHandler;
let depositHandler;
const walletMasterSeed = 'awesomeMasterSeed';
const walletPassword = 'P@ssw0rd';

beforeEach(async () => {
  db = await createDatabase('test.db');
  conf = await readFromFile('tests/config/files/config.test.json');
  providerPool = new ProviderPool(conf);
  providerPool.connect();
  contractPool = new ContractPool(conf, providerPool);
  walletHandler = new WalletHandler(db);
  depositHandler = new DepositHandler(walletHandler, contractPool, db, conf);
  await walletHandler.createWallet(walletMasterSeed, walletPassword);
  await contractPool.connect((address, abi, providerOrSigner) => {
    if (abi === MystikoABI.ERC20) {
      const defaultOwner = '0x7dfb6962c9974bf6334ab587b77030515886e96f';
      return new MockERC20Contract(address, abi, defaultOwner);
    } else {
      return new MockMystikoContract(address, abi, providerOrSigner);
    }
  });
});

afterEach(() => {
  db.database.close();
});

test('test createDeposit poly erc20', async () => {
  const request = {
    srcChainId: 1,
    dstChainId: 56,
    assetSymbol: 'USDT',
    bridge: BridgeType.POLY,
    amount: 100,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  const contracts = contractPool.getDepositContracts(1, 56, 'USDT', BridgeType.POLY);
  const signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1);
  let cbCount = 0;
  const cb = (deposit, oldStatus, newStatus) => {
    expect(deposit.status).toBe(newStatus);
    expect(oldStatus).not.toBe(newStatus);
    cbCount++;
  };
  const { deposit, depositPromise } = await depositHandler.createDeposit(request, signer, cb);
  expect(deposit.srcChainId).toBe(1);
  expect(deposit.dstChainId).toBe(56);
  expect(deposit.bridge).toBe(BridgeType.POLY);
  expect(deposit.amount.toString()).toBe(toDecimals(100, 18).toString());
  expect(deposit.shieldedRecipientAddress).toBe(request.shieldedAddress);
  expect(depositPromise).not.toBe(undefined);
  await depositPromise;
  expect(deposit.errorMessage).toBe(undefined);
  expect(contracts.asset.approveCount).toBe(1);
  expect(contracts.asset.tx).not.toBe(undefined);
  expect(deposit.assetApproveTxHash).toBe(contracts.asset.tx.hash);
  expect(contracts.protocol.tx).not.toBe(undefined);
  expect(deposit.srcTxHash).toBe(contracts.protocol.tx.hash);
  expect(cbCount).toBe(4);
  expect(deposit.status).toBe(DepositStatus.SRC_CONFIRMED);
});

test('test createDeposit loop erc20', async () => {
  const request = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'USDT',
    bridge: BridgeType.LOOP,
    amount: 200,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  const contracts = contractPool.getDepositContracts(1, 1, 'USDT', BridgeType.LOOP);
  contracts.asset._allowance['0x7dfb6962c9974bf6334ab587b77030515886e96f'][
    '0x98ed94360cad67a76a53d8aa15905e52485b73d1'
  ] = toDecimals(200, 18);
  const signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1);
  const { deposit, depositPromise } = await depositHandler.createDeposit(request, signer);
  expect(deposit.srcChainId).toBe(1);
  expect(deposit.dstChainId).toBe(1);
  expect(deposit.bridge).toBe(BridgeType.LOOP);
  expect(deposit.amount.toString()).toBe(toDecimals(200, 18).toString());
  expect(deposit.shieldedRecipientAddress).toBe(request.shieldedAddress);
  expect(depositPromise).not.toBe(undefined);
  await depositPromise;
  expect(deposit.errorMessage).toBe(undefined);
  expect(contracts.asset.approveCount).toBe(0);
  expect(contracts.asset.tx).toBe(undefined);
  expect(deposit.assetApproveTxHash).toBe(undefined);
  expect(contracts.protocol.tx).not.toBe(undefined);
  expect(deposit.srcTxHash).toBe(contracts.protocol.tx.hash);
  expect(deposit.status).toBe(DepositStatus.SUCCEEDED);
});

test('test createDeposit loop main', async () => {
  const request = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'ETH',
    bridge: BridgeType.LOOP,
    amount: 500,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  const contracts = contractPool.getDepositContracts(1, 1, 'ETH', BridgeType.LOOP);
  const signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1);
  const { deposit, depositPromise } = await depositHandler.createDeposit(request, signer);
  expect(deposit.srcChainId).toBe(1);
  expect(deposit.dstChainId).toBe(1);
  expect(deposit.bridge).toBe(BridgeType.LOOP);
  expect(deposit.amount.toString()).toBe(toDecimals(500, 18).toString());
  expect(deposit.shieldedRecipientAddress).toBe(request.shieldedAddress);
  expect(depositPromise).not.toBe(undefined);
  await depositPromise;
  expect(deposit.errorMessage).toBe(undefined);
  expect(contracts.asset).toBe(undefined);
  expect(deposit.assetApproveTxHash).toBe(undefined);
  expect(contracts.protocol.tx).not.toBe(undefined);
  expect(deposit.srcTxHash).toBe(contracts.protocol.tx.hash);
  expect(deposit.status).toBe(DepositStatus.SUCCEEDED);
});

test('test createDeposit loop error', async () => {
  const request = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'ETH',
    bridge: BridgeType.LOOP,
    amount: 500,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  const signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1);
  const contracts = contractPool.getDepositContracts(1, 1, 'ETH', BridgeType.LOOP);
  contracts.protocol.errorMessage = 'error here';
  const { deposit, depositPromise } = await depositHandler.createDeposit(request, signer);
  await depositPromise;
  expect(deposit.errorMessage).toBe('error here');
  expect(deposit.status).toBe(DepositStatus.FAILED);
});

test('test query deposits', async () => {
  const request1 = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'ETH',
    bridge: BridgeType.LOOP,
    amount: 200,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  const request2 = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'USDT',
    bridge: BridgeType.LOOP,
    amount: 500,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  const request3 = {
    srcChainId: 1,
    dstChainId: 56,
    assetSymbol: 'USDT',
    bridge: BridgeType.POLY,
    amount: 100,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  const signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1);
  const ret1 = await depositHandler.createDeposit(request1, signer);
  const ret2 = await depositHandler.createDeposit(request2, signer);
  const ret3 = await depositHandler.createDeposit(request3, signer);
  await ret1.depositPromise;
  await ret2.depositPromise;
  await ret3.depositPromise;
  expect(depositHandler.getDeposit(1).srcTxHash).toBe(ret1.deposit.srcTxHash);
  expect(depositHandler.getDeposit(10000)).toBe(undefined);
  expect(depositHandler.getDeposit('wrong tx hash')).toBe(undefined);
  expect(depositHandler.getDeposit(ret3.deposit.srcTxHash).id).toBe(3);
  expect(depositHandler.getDeposit(ret2.deposit).id).toBe(2);
  expect(depositHandler.getDepositsCount()).toBe(3);
  expect(depositHandler.getDepositsCount((d) => d.bridge === BridgeType.LOOP)).toBe(2);
  expect(
    depositHandler.getDeposits({
      filterFunc: (d) => d.bridge === BridgeType.LOOP,
      offset: 1,
      limit: 10,
    }).length,
  ).toBe(1);
  expect(
    depositHandler
      .getDeposits({
        sortBy: 'amount',
        desc: true,
      })
      .map((d) => d.id),
  ).toStrictEqual([2, 1, 3]);
});

test('test exportOffChainNote', async () => {
  const request = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'ETH',
    bridge: BridgeType.LOOP,
    amount: 200,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  const signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1);
  const ret = await depositHandler.createDeposit(request, signer);
  await ret.depositPromise;
  expect(() => depositHandler.exportOffChainNote(1000)).toThrow();
  const offChainNote = depositHandler.exportOffChainNote(ret.deposit.id);
  expect(offChainNote.chainId).toBe(ret.deposit.srcChainId);
  expect(offChainNote.transactionHash).toBe(ret.deposit.srcTxHash);
});
