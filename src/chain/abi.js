import ERC20 from './abis/ERC20.json';
import MystikoWithLoopERC20 from './abis/MystikoWithLoopERC20.json';
import MystikoWithLoopMain from './abis/MystikoWithLoopMain.json';
import MystikoWithPolyERC20 from './abis/MystikoWithPolyERC20.json';
import MystikoWithPolyMain from './abis/MystikoWithPolyMain.json';
import MystikoV2WithLoopERC20 from './abis/MystikoV2WithLoopERC20.json';
import MystikoV2WithLoopMain from './abis/MystikoV2WithLoopMain.json';
import { AssetType, BridgeType } from '../model';

/**
 * @typedef MystikoABI
 * @desc ABI definition of Mystiko's core smart contracts.
 * @property {{bridgeType: string, abi: {}, isMystiko: boolean}} ERC20
 * ABI for ERC20 asset's contract.
 * @property {{bridgeType: string, abi: {}, isMystiko: boolean, assetType: string}} Verifier
 * ABI for the Verifier contract.
 * @property {{bridgeType: string, abi: {}, isMystiko: boolean, assetType: string}} MystikoWithLoopERC20
 * ABI for the Mystiko's loop pool with ERC20 token contract.
 * @property {{bridgeType: string, abi: {}, isMystiko: boolean, assetType: string}} MystikoWithLoopMain
 * ABI for the Mystiko's loop pool with main asset contract
 * @property {{bridgeType: string, abi: {}, isMystiko: boolean, assetType: string}} MystikoWithPolyERC20
 * ABI for the Mystiko with Poly Bridge and ERC20 token contract.
 * @property {{bridgeType: string, abi: {}, isMystiko: boolean, assetType: string}} MystikoWithPolyMain
 * ABI for the Mystiko with Poly Bridge and main asset contract.
 */
export const MystikoABI = {
  ERC20: { abi: ERC20, isMystiko: false },
  MystikoWithLoopERC20: {
    abi: MystikoWithLoopERC20,
    isMystiko: true,
    bridgeType: BridgeType.LOOP,
    assetType: AssetType.ERC20,
  },
  MystikoWithLoopMain: {
    abi: MystikoWithLoopMain,
    isMystiko: true,
    bridgeType: BridgeType.LOOP,
    assetType: AssetType.MAIN,
  },
  MystikoWithPolyERC20: {
    abi: MystikoWithPolyERC20,
    isMystiko: true,
    bridgeType: BridgeType.POLY,
    assetType: AssetType.ERC20,
  },
  MystikoWithPolyMain: {
    abi: MystikoWithPolyMain,
    isMystiko: true,
    bridgeType: BridgeType.POLY,
    assetType: AssetType.MAIN,
  },
  MystikoWithTBridgeERC20: {
    abi: MystikoWithPolyERC20,
    isMystiko: true,
    bridgeType: BridgeType.TBRIDGE,
    assetType: AssetType.ERC20,
  },
  MystikoWithTBridgeMain: {
    abi: MystikoWithPolyMain,
    isMystiko: true,
    bridgeType: BridgeType.TBRIDGE,
    assetType: AssetType.MAIN,
  },
  MystikoV2WithLoopERC20: {
    abi: MystikoV2WithLoopERC20,
    isMystiko: true,
    bridgeType: BridgeType.LOOP,
    assetType: AssetType.ERC20,
  },
  MystikoV2WithLoopMain: {
    abi: MystikoV2WithLoopMain,
    isMystiko: true,
    bridgeType: BridgeType.LOOP,
    assetType: AssetType.MAIN,
  },
};
