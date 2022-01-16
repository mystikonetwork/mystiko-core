import { ethers } from 'ethers';
import { ContractConfig, AssetType, BridgeType } from '../config/contractConfig.js';
import { check, readJsonFile } from '../utils.js';

export async function createContract(contractConfig, signerOrProvider) {
  check(contractConfig instanceof ContractConfig, 'contractConfig should be instance of ContractConfig');
  const { abi } = await readJsonFile(contractConfig.abiFile);
  check(abi, 'failed to get abi information from ' + contractConfig.abiFile);
  return new ethers.Contract(contractConfig.address, abi, signerOrProvider);
}

export async function validContractConfig(contractConfig, contract) {
  check(contractConfig instanceof ContractConfig, 'contractConfig should be instance of ContractConfig');
  check(contract instanceof ethers.Contract, 'contract should be instance of ethers.Contract');
  check(contract.address === contractConfig.address, 'address does not match');
  const assetType = await contract.assetType();
  check(assetType === contractConfig.assetType, 'asset type does not match');
  const bridgeType = await contract.bridgeType();
  check(bridgeType === contractConfig.bridgeType, 'bridge type does not match');
  if (assetType !== AssetType.MAIN) {
    const assetSymbol = await contract.assetSymbol();
    check(assetSymbol === contractConfig.assetSymbol, 'asset symbol does not match');
    const assetDecimals = await contract.assetDecimals();
    check(assetDecimals === contractConfig.assetDecimals, 'asset decimals does not match');
  }
  if (bridgeType !== BridgeType.LOOP) {
    const peerChainId = await contract.peerChainId();
    check(peerChainId === contractConfig.peerChainId, 'peerChainId does not match');
    const peerContractAddress = await contract.peerContractAddress();
    check(peerContractAddress === contractConfig.peerContractAddress, 'peerContractAddress does not match');
  }
}
