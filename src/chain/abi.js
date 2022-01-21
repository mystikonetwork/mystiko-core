import ERC20 from '../../build/contracts/ERC20.json';
import MystikoWithLoopERC20 from '../../build/contracts/MystikoWithLoopERC20.json';
import MystikoWithLoopMain from '../../build/contracts/MystikoWithLoopMain.json';
import MystikoWithPolyERC20 from '../../build/contracts/MystikoWithPolyERC20.json';
import MystikoWithPolyMain from '../../build/contracts/MystikoWithPolyMain.json';
import Verifier from '../../build/contracts/Verifier.json';

export const MystikoABI = {
  ERC20: ERC20.abi,
  Verifier: Verifier.abi,
  MystikoWithLoopERC20: MystikoWithLoopERC20.abi,
  MystikoWithLoopMain: MystikoWithLoopMain.abi,
  MystikoWithPolyERC20: MystikoWithPolyERC20.abi,
  MystikoWithPolyMain: MystikoWithPolyMain.abi,
};
