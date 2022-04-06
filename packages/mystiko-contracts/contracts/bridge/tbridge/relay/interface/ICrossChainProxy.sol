// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface ICrossChainProxy {
  event TBridgeCrossChainMessage(address toContract, uint256 toChainId, address fromContract, bytes message);

  function sendMessage(
    address _toContract,
    uint256 _toChainId,
    bytes memory _message
  ) external payable;
}
