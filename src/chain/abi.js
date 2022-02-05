import ERC20 from '../../build/contracts/ERC20.json';
import MystikoWithLoopERC20 from '../../build/contracts/MystikoWithLoopERC20.json';
import MystikoWithLoopMain from '../../build/contracts/MystikoWithLoopMain.json';
import MystikoWithPolyERC20 from '../../build/contracts/MystikoWithPolyERC20.json';
import MystikoWithPolyMain from '../../build/contracts/MystikoWithPolyMain.json';
import MystikoV2WithLoopERC20 from '../../build/contracts/MystikoV2WithLoopERC20.json';
import MystikoV2WithLoopMain from '../../build/contracts/MystikoV2WithLoopMain.json';

/**
 * @typedef MystikoABI
 * @desc ABI definition of Mystiko's core smart contracts.
 * @property {Object} ERC20 ABI for ERC20 asset's contract.
 * @property {Object} MystikoWithLoopERC20 ABI for the Mystiko's loop pool with ERC20 token contract.
 * @property {Object} MystikoWithLoopMain ABI for the Mystiko's loop pool with main asset contract
 * @property {Object} MystikoWithPolyERC20 ABI for the Mystiko with Poly Bridge and ERC20 token contract.
 * @property {Object} MystikoWithPolyMain ABI for the Mystiko with Poly Bridge and main asset contract.
 */
export const MystikoABI = {
  ERC20: ERC20.abi,
  MystikoWithLoopERC20: MystikoWithLoopERC20.abi,
  MystikoWithLoopMain: MystikoWithLoopMain.abi,
  MystikoWithPolyERC20: MystikoWithPolyERC20.abi,
  MystikoWithPolyMain: MystikoWithPolyMain.abi,
  MystikoV2WithLoopERC20: MystikoV2WithLoopERC20.abi,
  MystikoV2WithLoopMain: MystikoV2WithLoopMain.abi,
};
