// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interface/ICrossChainProxy.sol";
import "../../base/CrossChainDataSerializable.sol";
import "../MystikoWithTBridge.sol";

contract MystikoTBridgeProxy is CrossChainDataSerializable, ICrossChainProxy {
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
    uint256 _toChainId,
    bytes memory _message
  ) external payable override {
    emit TBridgeCrossChainMessage(_toContract, _toChainId, msg.sender, _message);
  }

  function crossChainSyncTx(
    uint64 _fromChainId,
    address _fromContractAddress,
    address _toContractAddress,
    bytes calldata _message
  ) external onlyOperator returns (bool) {
    require(
      MystikoWithTBridge(_toContractAddress).syncDepositTx(_fromChainId, _fromContractAddress, _message),
      "call syncDepositTx returns error"
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
