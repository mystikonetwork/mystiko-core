// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interface/ICrossChainProxy.sol";
import "../../CrossChainDataSerializable.sol";
import "../MystikoWithTBridge.sol";

contract MystikoTBridgeProxy is CrossChainDataSerializable, ICrossChainProxy {
  event MerkleTreeInsert(bytes32 indexed leaf, uint32 leafIndex, uint256 amount);

  address public operator;

  constructor() {
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
    uint256 commitment
  ) external onlyOperator returns (bool) {
    CrossChainData memory txData = CrossChainData({amount: amount, commitment: commitment});
    bytes memory txDataBytes = serializeTxData(txData);
    bytes memory fromContractAddressBytes = Utils.addressToBytes(_fromContractAddress);
    require(
      MystikoWithTBridge(_toContractAddress).syncDepositTx(
        txDataBytes,
        fromContractAddressBytes,
        _fromChainId
      ),
      "call syncDepositTx returns error"
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
