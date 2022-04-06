// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface ICrossChainProxy {
  event TBridgeCrossChainMessage(address toContract, uint64 toChainId, address fromContract, bytes message);

  function sendMessage(
    uint64 _toChainId,
    address _toContract,
    bytes memory _message
  ) external payable;
}
