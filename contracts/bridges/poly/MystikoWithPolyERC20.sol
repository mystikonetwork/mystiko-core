// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoWithPoly.sol";
import "../../pool/ERC20AssetPool.sol";

contract MystikoWithPolyERC20 is MystikoWithPoly, ERC20AssetPool {
  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    address _verifier,
    address _token,
    address _hasher2,
    address _hasher3,
    uint32 _merkleTreeHeight
  )
    public
    MystikoWithPoly(_relayProxyAddress, _peerChainId, _verifier, _hasher2, _hasher3, _merkleTreeHeight)
    ERC20AssetPool(_token)
  {}
}
