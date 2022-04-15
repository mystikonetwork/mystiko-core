// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interface/ICrossChainProxy.sol";
import "../../base/CrossChainDataSerializable.sol";
import "../../../../interface/IMystikoBridge.sol";

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
    uint256 _fromChainId,
    address _fromContract,
    address _toContract,
    bytes calldata _message
  ) external onlyOperator returns (bool) {
    ICommitmentPool.CommitmentRequest memory cmRequest = deserializeTxData(_message);
    require(
      IMystikoBridge(_toContract).bridgeCommitment(_fromChainId, _fromContract, cmRequest),
      "proxy call bridgeCommitment error"
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
