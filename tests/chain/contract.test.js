import { ethers } from 'ethers';
import { createContract, validContractConfig } from '../../src/chain/contract.js';
import { ContractConfig } from '../../src/config/contractConfig.js';
import { readJsonFile } from '../../src/utils.js';
import { AssetType, BridgeType } from '../../src/config/contractConfig.js';

class MockContract extends ethers.Contract {
  constructor(
    address,
    abi,
    assetType,
    bridgeType,
    assetSymbol,
    assetDecimals,
    peerChainId,
    peerContractAddress,
  ) {
    super(address, abi);
    this._assetType = assetType;
    this._bridgeType = bridgeType;
    this._assetSymbol = assetSymbol;
    this._assetDecimals = assetDecimals;
    this._peerChainId = peerChainId;
    this._peerContractAddress = peerContractAddress;
  }

  assetType() {
    return new Promise((resolve) => resolve(this._assetType));
  }

  bridgeType() {
    return new Promise((resolve) => resolve(this._bridgeType));
  }

  assetSymbol() {
    return new Promise((resolve) => resolve(this._assetSymbol));
  }

  assetDecimals() {
    return new Promise((resolve) => resolve(this._assetDecimals));
  }

  peerChainId() {
    return new Promise((resolve) => resolve(this._peerChainId));
  }

  peerContractAddress() {
    return new Promise((resolve) => resolve(this._peerContractAddress));
  }
}

test('test creatCreate', async () => {
  await expect(createContract({})).rejects.toThrow();
  const contractConfig = new ContractConfig({
    address: '0x98ED94360CAd67A76a53d8Aa15905E52485B73d1',
    assetSymbol: 'USDT',
    assetDecimals: 18,
    assetType: 'erc20',
    bridgeType: 'loop',
    abiFile: 'build/contracts/MystikoWithLoopERC20.json',
    wasmFile: 'withdraw.wasm',
    zkeyFile: 'withdraw.zkey',
    vkeyFile: 'withdraw.vkey.json',
  });
  const contract = await createContract(contractConfig);
  expect(contract.address).toBe(contractConfig.address);
});

test('test validContractConfig', async () => {
  const address = '0x98ED94360CAd67A76a53d8Aa15905E52485B73d1';
  const peerAddress = '0x8fb1df17768e29c936edfbce1207ad13696268b7';
  const abi1 = await readJsonFile('build/contracts/MystikoWithLoopERC20.json');
  const abi2 = await readJsonFile('build/contracts/MystikoWithLoopMain.json');
  const abi3 = await readJsonFile('build/contracts/MystikoWithPolyERC20.json');
  const abi4 = await readJsonFile('build/contracts/MystikoWithPolyMain.json');
  const contract1 = new MockContract(address, abi1.abi, AssetType.ERC20, BridgeType.LOOP, 'USDT', 18);
  const contract2 = new MockContract(address, abi2.abi, AssetType.MAIN, BridgeType.LOOP);
  const contract3 = new MockContract(
    address,
    abi3.abi,
    AssetType.ERC20,
    BridgeType.POLY,
    'USDT',
    18,
    56,
    peerAddress,
  );
  const contract4 = new MockContract(
    address,
    abi4.abi,
    AssetType.MAIN,
    BridgeType.POLY,
    undefined,
    undefined,
    56,
    peerAddress,
  );
  const contractConfig1 = new ContractConfig({
    address: address,
    assetSymbol: 'USDT',
    assetDecimals: 18,
    assetType: 'erc20',
    bridgeType: 'loop',
    abiFile: 'build/contracts/MystikoWithLoopERC20.json',
    wasmFile: 'withdraw.wasm',
    zkeyFile: 'withdraw.zkey',
    vkeyFile: 'withdraw.vkey.json',
  });
  const contractConfig2 = new ContractConfig({
    address: address,
    assetSymbol: 'ETH',
    assetDecimals: 18,
    assetType: 'main',
    bridgeType: 'loop',
    abiFile: 'build/contracts/MystikoWithLoopMain.json',
    wasmFile: 'withdraw.wasm',
    zkeyFile: 'withdraw.zkey',
    vkeyFile: 'withdraw.vkey.json',
  });
  const contractConfig3 = new ContractConfig({
    address: address,
    assetSymbol: 'USDT',
    assetDecimals: 18,
    assetType: 'erc20',
    bridgeType: 'poly',
    peerContractAddress: peerAddress,
    peerChainId: 56,
    abiFile: 'build/contracts/MystikoWithPolyERC20.json',
    wasmFile: 'withdraw.wasm',
    zkeyFile: 'withdraw.zkey',
    vkeyFile: 'withdraw.vkey.json',
  });
  const contractConfig4 = new ContractConfig({
    address: '0x98ED94360CAd67A76a53d8Aa15905E52485B73d1',
    assetSymbol: 'ETH',
    assetDecimals: 18,
    assetType: 'main',
    bridgeType: 'poly',
    peerContractAddress: peerAddress,
    peerChainId: 56,
    abiFile: 'build/contracts/MystikoWithPolyMain.json',
    wasmFile: 'withdraw.wasm',
    zkeyFile: 'withdraw.zkey',
    vkeyFile: 'withdraw.vkey.json',
  });
  await validContractConfig(contractConfig1, contract1);
  await validContractConfig(contractConfig2, contract2);
  await validContractConfig(contractConfig3, contract3);
  await validContractConfig(contractConfig4, contract4);
  await expect(validContractConfig(contractConfig1, contract2)).rejects.toThrow();
  await expect(validContractConfig(contractConfig2, contract3)).rejects.toThrow();
  await expect(validContractConfig(contractConfig3, contract4)).rejects.toThrow();
  await expect(validContractConfig(contractConfig1, contract4)).rejects.toThrow();
});
