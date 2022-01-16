// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoWithPoly.sol";
import "../../pool/MainAssetPool.sol";

contract MystikoWithPolyMain is MystikoWithPoly, MainAssetPool {
  constructor(
    address _eccmp,
    uint64 _peerChainId,
    address _verifier,
    address _hasher,
    uint32 _merkleTreeHeight
  ) public MystikoWithPoly(_eccmp, _peerChainId, _verifier, _hasher, _merkleTreeHeight) {}
}
