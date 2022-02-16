// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoWithLoop.sol";
import "../../pool/ERC20AssetPool.sol";

contract MystikoWithLoopERC20 is MystikoWithLoop, ERC20AssetPool {
  constructor(
    address _verifier,
    address _token,
    address _hasher2,
    uint32 _merkleTreeHeight
  ) public MystikoWithLoop(_verifier, _hasher2, _merkleTreeHeight) ERC20AssetPool(_token) {}
}
