// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;
pragma experimental ABIEncoderV2;

import "./MystikoWithAnyswap.sol";
import "../../pool/MainAssetPool.sol";

contract MystikoWithAnyswapMain is MystikoWithAnySwap, MainAssetPool {
  event Received(address, uint256);

  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    address _verifier,
    address _hasher,
    uint32 _merkleTreeHeight
  ) public MystikoWithAnySwap(_relayProxyAddress, _peerChainId, _verifier, _hasher, _merkleTreeHeight) {}

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }
}
