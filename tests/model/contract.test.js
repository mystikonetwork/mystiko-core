import { AssetType, BridgeType, Contract } from '../../src/model';

test('test Contract getters/setters', () => {
  const contract = new Contract();
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
  expect(contract.syncedBlock).toBe(undefined);

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
});
