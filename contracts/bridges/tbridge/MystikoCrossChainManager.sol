// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "../CrossChainDataSerializable.sol";
import "../poly/MystikoWithPoly.sol";

contract MystikoCrossChainManager is CrossChainDataSerializable {
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
  ) external returns (bool) {
    CrossChainData memory txData = CrossChainData({amount: amount, commitmentHash: commitmentHash});
    bytes memory txDataBytes = _serializeTxData(txData);
    bytes memory fromContractAddressBytes = Utils.addressToBytes(_fromContractAddress);
    require(
      MystikoWithPoly(_toContractAddress).syncTx(txDataBytes, fromContractAddressBytes, _fromChainId),
      "call syncTx returns error"
    );
    return true;
  }

  function _serializeTxData(CrossChainData memory data) internal pure returns (bytes memory) {
    bytes memory buff;
    buff = abi.encodePacked(
      ZeroCopySink.WriteUint255(data.amount),
      ZeroCopySink.WriteVarBytes(abi.encodePacked(data.commitmentHash))
    );
    return buff;
  }
}
