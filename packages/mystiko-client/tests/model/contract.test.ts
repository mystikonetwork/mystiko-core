import BN from 'bn.js';
import { MystikoABI, AssetType, BridgeType } from '@mystiko/config';
import { Contract } from '../../src';

test('test Contract getters/setters', () => {
  const contract = new Contract();
  expect(contract.version).toBe(0);
  expect(contract.name).toBe(undefined);
  expect(contract.chainId).toBe(undefined);
  expect(contract.address).toBe(undefined);
  expect(contract.assetSymbol).toBe(undefined);
  expect(contract.assetType).toBe(undefined);
  expect(contract.assetAddress).toBe(undefined);
  expect(contract.assetDecimals).toBe(undefined);
  expect(contract.bridgeType).toBe(undefined);
  expect(contract.peerChainId).toBe(undefined);
  expect(contract.peerContractAddress).toBe(undefined);
  expect(contract.circuits).toBe(undefined);
  expect(contract.syncedBlock).toBe(0);
  expect(contract.abi).toBe(undefined);
  expect(contract.depositDisabled).toBe(false);
  expect(contract.minBridgeFee.toNumber()).toBe(0);
  expect(contract.syncStart).toBe(0);
  expect(contract.getSyncedTopicBlock('any topic')).toBe(0);

  contract.version = 12;
  expect(contract.version).toBe(12);
  contract.name = 'MystikoWithLoopMain';
  expect(contract.name).toBe('MystikoWithLoopMain');
  contract.chainId = 96;
  expect(contract.chainId).toBe(96);
  expect(() => {
    contract.address = '0xdeadbeef';
  }).toThrow();
  contract.address = '0xCD8BbF2f05Fbc87dA28844B33D06c5c249598223';
  expect(contract.address).toBe('0xCD8BbF2f05Fbc87dA28844B33D06c5c249598223');
  contract.assetSymbol = 'MTT';
  expect(contract.assetSymbol).toBe('MTT');
  contract.assetType = AssetType.ERC20;
  expect(contract.assetType).toBe(AssetType.ERC20);
  contract.assetAddress = undefined;
  expect(contract.assetAddress).toBe(undefined);
  contract.assetAddress = '0x39e68dd41AF6Fd870f27a6B77cBcfFA64626b0f3';
  expect(contract.assetAddress).toBe('0x39e68dd41AF6Fd870f27a6B77cBcfFA64626b0f3');
  contract.assetDecimals = 18;
  expect(contract.assetDecimals).toBe(18);
  contract.bridgeType = BridgeType.LOOP;
  expect(contract.bridgeType).toBe(BridgeType.LOOP);
  contract.peerChainId = undefined;
  expect(contract.peerChainId).toBe(undefined);
  contract.peerChainId = 3;
  expect(contract.peerChainId).toBe(3);
  contract.peerContractAddress = undefined;
  expect(contract.peerContractAddress).toBe(undefined);
  contract.peerContractAddress = '0x4489E7219df6aF8c5027121E04eAA60161926703';
  expect(contract.peerContractAddress).toBe('0x4489E7219df6aF8c5027121E04eAA60161926703');
  contract.circuits = 'circom-1.0';
  expect(contract.circuits).toBe('circom-1.0');
  contract.syncedBlock = 1000000;
  expect(contract.syncedBlock).toBe(1000000);
  expect(contract.abi).toStrictEqual(MystikoABI.MystikoWithLoopMain.abi);
  contract.name = 'Wrong Contract';
  expect(contract.abi).toBe(undefined);
  contract.depositDisabled = true;
  expect(contract.depositDisabled).toBe(true);
  contract.minBridgeFee = new BN(123);
  expect(contract.minBridgeFee.toNumber()).toBe(123);
  contract.syncStart = 456;
  expect(contract.syncStart).toBe(456);
  expect(contract.getSyncedTopicBlock('any topic')).toBe(456);
  expect(() => {
    contract.setSyncedTopicBlock('any topic', 123);
  }).toThrow();
  contract.setSyncedTopicBlock('some topic', 987);
  expect(contract.getSyncedTopicBlock('some topic')).toBe(987);
  expect(contract.getSyncedTopicBlock('another topic')).toBe(456);
  contract.setSyncedTopicBlock('another topic', 678);
  contract.setSyncedTopicBlock('some topic', 987);
  expect(contract.getSyncedTopicBlock('another topic')).toBe(678);
});
