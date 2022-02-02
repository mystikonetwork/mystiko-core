// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoWithCeler.sol";
import "../../pool/MainAssetPool.sol";

contract MystikoWithCelerMain is MystikoWithCeler, MainAssetPool {
  event Received(address, uint256);

  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    address _verifier,
    address _hasher2,
    address _hasher3,
    uint32 _merkleTreeHeight
  )
    public
    MystikoWithCeler(_relayProxyAddress, _peerChainId, _verifier, _hasher2, _hasher3, _merkleTreeHeight)
  {}

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }
}
