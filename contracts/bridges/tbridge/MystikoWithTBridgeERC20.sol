// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoWithTBridge.sol";
import "../../pool/ERC20AssetPool.sol";

contract MystikoWithTBridgeERC20 is MystikoWithTBridge, ERC20AssetPool {
  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    address _verifier,
    address _token,
    address _hasher,
    uint32 _merkleTreeHeight
  )
    public
    MystikoWithTBridge(_relayProxyAddress, _peerChainId, _verifier, _hasher, _merkleTreeHeight)
    ERC20AssetPool(_token)
  {}
}
