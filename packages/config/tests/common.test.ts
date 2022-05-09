import {
  AssetType,
  BridgeType,
  CircuitType,
  ContractType,
  isValidAssetType,
  isValidBridgeType,
  isValidCircuitType,
  isValidContractType,
} from '../src';

test('test isValidBridgeType', () => {
  expect(isValidBridgeType(BridgeType.CELER)).toBe(true);
  expect(isValidBridgeType('wrong type' as BridgeType)).toBe(false);
});

test('test isValidAssetType', () => {
  expect(isValidAssetType(AssetType.ERC20)).toBe(true);
  expect(isValidAssetType('wrong type' as AssetType)).toBe(false);
});

test('test isValidCircuitType', () => {
  expect(isValidCircuitType(CircuitType.ROLLUP1)).toBe(true);
  expect(isValidCircuitType('wrong type' as CircuitType)).toBe(false);
});

test('test isValidContractType', () => {
  expect(isValidContractType(ContractType.POOL)).toBe(true);
  expect(isValidContractType('wrong type' as ContractType)).toBe(false);
});
