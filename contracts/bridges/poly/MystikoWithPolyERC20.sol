// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoWithPoly.sol";
import "../../pool/ERC20AssetPool.sol";

contract MystikoWithPolyERC20 is MystikoWithPoly, ERC20AssetPool {
  constructor(
    address _eccmp,
    uint64 _peerChainId,
    address _verifier,
    address _token,
    address _hasher,
    uint32 _merkleTreeHeight
  ) public MystikoWithPoly(
    _eccmp, _peerChainId, _verifier, _hasher, _merkleTreeHeight, TokenType.MAIN)
    ERC20AssetPool(_token) {}
}