// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interface/ICrossChainProxy.sol";
import "../../base/CrossChainDataSerializable.sol";
import "../MystikoV2WithTBridge.sol";

contract MystikoTBridgeProxy is ICrossChainProxy {
  address public operator;

  constructor() {
    operator = msg.sender;
  }

  modifier onlyOperator() {
    require(msg.sender == operator, "Only operator.");
    _;
  }

  function sendMessage(
    address _toContract,
    uint64 _toChainId,
    bytes memory _message
  ) external payable override {
    emit TBridgeCrossChainMessage(_toContract, _toChainId, msg.sender, _message);
  }

  function crossChainSyncTx(
    uint64 _fromChainId,
    address _fromContract,
    address _toContract,
    address _executor,
    bytes calldata _message
  ) external onlyOperator returns (bool) {
    require(
      MystikoV2WithTBridge(_toContract).crossChainSyncTx(_fromChainId, _fromContract, _message, _executor),
      "call crossChainSyncTx error"
    );
    return true;
  }

  function changeOperator(address _newOperator) external onlyOperator {
    operator = _newOperator;
  }

  function withdraw(address _recipient) external payable onlyOperator {
    (bool success, ) = _recipient.call{value: address(this).balance}("");
    require(success, "withdraw failed");
  }
}
