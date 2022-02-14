// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoWithTBridge.sol";
import "../../pool/MainAssetPool.sol";

contract MystikoWithTBridgeMain is MystikoWithTBridge, MainAssetPool {
  event Received(address, uint256);

  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    address _verifier,
    address _hasher,
    uint32 _merkleTreeHeight
  ) public MystikoWithTBridge(_relayProxyAddress, _peerChainId, _verifier, _hasher, _merkleTreeHeight) {}

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }
}
