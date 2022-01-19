import BN from 'bn.js';
import { ethers } from 'ethers';
import { DepositHandler } from '../../src/handler/depositHandler.js';
import config from '../../src/config';
import { ContractPool } from '../../src/chain/contract.js';
import { createDatabase } from '../../src/database';
import { WalletHandler } from '../../src/handler/walletHandler.js';
import { BaseSigner } from '../../src/chain/signer.js';
import { toHex } from '../../src/utils.js';
import erc20Abi from '../../src/chain/abi/ERC20.json';

class MockTransactionResponse {
  constructor(result, shouldReject = false) {
    this.result = result;
    this.shouldReject = shouldReject;
  }
  wait() {
    return new Promise((resolve, reject) => {
      if (!this.shouldReject) {
        resolve(this.result);
      } else {
        reject(this.result);
      }
    });
  }
}

class MockERC20Contract extends ethers.Contract {
  constructor(address, abi, defaultOwner, initialBalances = {}) {
    super(address, abi);
    this._allowance = {};
    this.defaultOwner = defaultOwner;
    this.balance = { ...initialBalances };
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
    amount = new BN(amount);
    return new Promise((resolve) => {
      if (!this.balance[this.defaultOwner]) {
        resolve(new MockTransactionResponse(false, true));
      } else if (this.balance[this.defaultOwner].lt(amount)) {
        resolve(new MockTransactionResponse(false, true));
      } else {
        if (!this._allowance[this.defaultOwner]) {
          this._allowance[this.defaultOwner] = {};
        }
        this._allowance[this.defaultOwner][spender] = amount;
        resolve(new MockTransactionResponse(true));
      }
    });
  }
}

class MockMystikoContract extends ethers.Contract {
  constructor(address, abi, providerOrSigner, contractConfig) {
    super(address, abi, providerOrSigner);
    this.config = contractConfig;
  }

  assetType() {
    return new Promise((resolve) => resolve(this.config.assetType));
  }

  bridgeType() {
    return new Promise((resolve) => resolve(this.config.bridgeType));
  }

  asset() {
    return new Promise((resolve) => resolve(this.config.assetAddress));
  }

  assetSymbol() {
    return new Promise((resolve) => resolve(this.config.assetSymbol));
  }

  assetDecimals() {
    return new Promise((resolve) => resolve(this.config.assetDecimals));
  }

  peerChainId() {
    return new Promise((resolve) => resolve(this.config.peerChainId));
  }

  peerContractAddress() {
    return new Promise((resolve) => resolve(this.config.peerContractAddress));
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
let contractPool;
let walletHandler;
let depositHandler;
const walletMasterSeed = 'awesomeMasterSeed';
const walletPassword = 'P@ssw0rd';

beforeEach(async () => {
  db = await createDatabase('test.db');
  conf = await config.readFromFile('tests/config/files/config.test.json');
  contractPool = new ContractPool(conf);
  walletHandler = new WalletHandler(db);
  depositHandler = new DepositHandler(walletHandler, contractPool, db, conf);
  await walletHandler.createWallet(walletMasterSeed, walletPassword);
});

afterEach(() => {
  db.database.close();
});

test('test approveAsset', async () => {
  await contractPool.connect((address, abi, providerOrSigner) => {
    if (abi === erc20Abi) {
      const defaultOwner = '0x7dfb6962c9974bf6334ab587b77030515886e96f';
      return new MockERC20Contract(address, abi, defaultOwner, {
        [defaultOwner]: new BN('1000000000000000000000'),
      });
    } else {
      for (let i = 0; i < conf.chainIds.length; i++) {
        const chainId = conf.chainIds[i];
        const contractConfig = conf.getChainConfig(chainId).getContract(address);
        if (contractConfig) {
          return new MockMystikoContract(address, abi, providerOrSigner, contractConfig);
        }
      }
      throw new Error('should not reach here');
    }
  });
  const mockSigner = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1);
  let result = await depositHandler.approveAsset(mockSigner, 1, 56, 'USDT', config.BridgeType.POLY, 2000);
  expect(result).toBe(false);
  result = await depositHandler.approveAsset(mockSigner, 1, 56, 'USDT', config.BridgeType.POLY, 500);
  expect(result).toBe(true);
  result = await depositHandler.approveAsset(mockSigner, 1, 56, 'USDT', config.BridgeType.POLY, 1000);
  expect(result).toBe(true);
  result = await depositHandler.approveAsset(mockSigner, 1, 56, 'USDT', config.BridgeType.POLY, 1000);
  expect(result).toBe(true);
  result = await depositHandler.approveAsset(mockSigner, 1, 1, 'ETH', config.BridgeType.LOOP, 1000);
  expect(result).toBe(true);
});
