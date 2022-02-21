// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./relay/interface/ICrossChainProxy.sol";
import "../CrossChainDataSerializable.sol";
import "./MystikoWithTBridge.sol";

contract MystikoTBridgeProxy is CrossChainDataSerializable, ICrossChainProxy {
  event MerkleTreeInsert(bytes32 indexed leaf, uint32 leafIndex, uint256 amount);

  address public operator;

  constructor() public {
    operator = msg.sender;
  }

  modifier onlyOperator() {
    require(msg.sender == operator, "Only operator.");
    _;
  }

  function crossChainSyncTx(
    uint64 _fromChainId,
    address _fromContractAddress,
    address _toContractAddress,
    uint256 amount,
    bytes32 commitmentHash
  ) external onlyOperator returns (bool) {
    CrossChainData memory txData = CrossChainData({amount: amount, commitmentHash: commitmentHash});
    bytes memory txDataBytes = serializeTxData(txData);
    bytes memory fromContractAddressBytes = Utils.addressToBytes(_fromContractAddress);
    require(
      MystikoWithTBridge(_toContractAddress).syncTx(txDataBytes, fromContractAddressBytes, _fromChainId),
      "call syncTx returns error"
    );
    return true;
  }

  function sendMessage(
    uint64 _toChainId,
    address _toContract,
    bytes memory _message
  ) external payable override {
    emit TBridgeCrossChainMessage(_toContract, _toChainId, msg.sender, _message);
  }

  function changeOperator(address _newOperator) external onlyOperator {
    operator = _newOperator;
  }
}
