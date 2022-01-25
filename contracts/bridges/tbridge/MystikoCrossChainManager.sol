// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "../CrossChainDataSerializable.sol";
import "../poly/MystikoWithPoly.sol";

contract MystikoCrossChainManager is
  CrossChainDataSerializable,
  IEthCrossChainManager,
  IEthCrossChainManagerProxy
{
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
      MystikoWithPoly(_toContractAddress).syncTx(txDataBytes, fromContractAddressBytes, _fromChainId),
      "call syncTx returns error"
    );
    return true;
  }

  function crossChain(
    uint64 _toChainId,
    bytes calldata _toContract,
    bytes calldata _method,
    bytes calldata _txData
  ) external override returns (bool) {
    return true;
  }

  function getEthCrossChainManager() external view override returns (address) {
    return address(this);
  }
}
