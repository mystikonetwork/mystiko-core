import ERC20 from './json/abi/ERC20.json';
import MystikoWithLoopERC20 from './json/abi/MystikoWithLoopERC20.json';
import MystikoWithLoopMain from './json/abi/MystikoWithLoopMain.json';
import MystikoWithPolyERC20 from './json/abi/MystikoWithPolyERC20.json';
import MystikoWithPolyMain from './json/abi/MystikoWithPolyMain.json';
import MystikoWithCelerERC20 from './json/abi/MystikoWithCelerERC20.json';
import MystikoWithCelerMain from './json/abi/MystikoWithCelerMain.json';
import MystikoWithTBridgeERC20 from './json/abi/MystikoWithTBridgeERC20.json';
import MystikoWithTBridgeMain from './json/abi/MystikoWithTBridgeMain.json';
import MystikoV2WithLoopERC20 from './json/abi/MystikoV2WithLoopERC20.json';
import MystikoV2WithLoopMain from './json/abi/MystikoV2WithLoopMain.json';
import { AssetType, BridgeType } from './base';

export interface ContractMeta {
  abi: any;
  isMystiko: boolean;
}

export interface MystikoContractMeta extends ContractMeta {
  bridgeType: BridgeType;
  assetType: AssetType;
}

export interface MystikoABIType {
  ERC20: ContractMeta;
  MystikoWithLoopERC20: MystikoContractMeta;
  MystikoWithLoopMain: MystikoContractMeta;
  MystikoWithPolyMain: MystikoContractMeta;
  MystikoWithPolyERC20: MystikoContractMeta;
  MystikoWithTBridgeERC20: MystikoContractMeta;
  MystikoWithTBridgeMain: MystikoContractMeta;
  MystikoV2WithLoopERC20: MystikoContractMeta;
  MystikoV2WithLoopMain: MystikoContractMeta;
  MystikoWithCelerERC20: MystikoContractMeta;
  MystikoWithCelerMain: MystikoContractMeta;
  [key: string]: ContractMeta | MystikoContractMeta | undefined;
}

export const MystikoABI: MystikoABIType = {
  ERC20: { abi: ERC20, isMystiko: false } as ContractMeta,
  MystikoWithLoopERC20: {
    abi: MystikoWithLoopERC20,
    isMystiko: true,
    bridgeType: BridgeType.LOOP,
    assetType: AssetType.ERC20,
  } as MystikoContractMeta,
  MystikoWithLoopMain: {
    abi: MystikoWithLoopMain,
    isMystiko: true,
    bridgeType: BridgeType.LOOP,
    assetType: AssetType.MAIN,
  } as MystikoContractMeta,
  MystikoWithPolyERC20: {
    abi: MystikoWithPolyERC20,
    isMystiko: true,
    bridgeType: BridgeType.POLY,
    assetType: AssetType.ERC20,
  } as MystikoContractMeta,
  MystikoWithPolyMain: {
    abi: MystikoWithPolyMain,
    isMystiko: true,
    bridgeType: BridgeType.POLY,
    assetType: AssetType.MAIN,
  } as MystikoContractMeta,
  MystikoWithTBridgeERC20: {
    abi: MystikoWithTBridgeERC20,
    isMystiko: true,
    bridgeType: BridgeType.TBRIDGE,
    assetType: AssetType.ERC20,
  } as MystikoContractMeta,
  MystikoWithTBridgeMain: {
    abi: MystikoWithTBridgeMain,
    isMystiko: true,
    bridgeType: BridgeType.TBRIDGE,
    assetType: AssetType.MAIN,
  },
  MystikoV2WithLoopERC20: {
    abi: MystikoV2WithLoopERC20,
    isMystiko: true,
    bridgeType: BridgeType.LOOP,
    assetType: AssetType.ERC20,
  } as MystikoContractMeta,
  MystikoV2WithLoopMain: {
    abi: MystikoV2WithLoopMain,
    isMystiko: true,
    bridgeType: BridgeType.LOOP,
    assetType: AssetType.MAIN,
  } as MystikoContractMeta,
  MystikoWithCelerERC20: {
    abi: MystikoWithCelerERC20,
    isMystiko: true,
    bridgeType: BridgeType.CELER,
    assetType: AssetType.ERC20,
  },
  MystikoWithCelerMain: {
    abi: MystikoWithCelerMain,
    isMystiko: true,
    bridgeType: BridgeType.CELER,
    assetType: AssetType.MAIN,
  } as MystikoContractMeta,
};
