// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "../bridges/poly/cross_chain_manager/interface/IEthCrossChainManager.sol";
import "../bridges/poly/cross_chain_manager/interface/IEthCrossChainManagerProxy.sol";
import "../bridges/poly/MystikoWithPoly.sol";
import "../libs/utils/Utils.sol";

contract PolyCrossChainManagerMock is IEthCrossChainManager, IEthCrossChainManagerProxy {
  address public operator;
  uint64 public chainIdA;
  address public contractAddressA;
  uint64 public chainIdB;
  address public contractAddressB;

  constructor() public {
    operator = msg.sender;
  }

  modifier onlyOperator() {
    require(msg.sender == operator, "Only operator.");
    _;
  }

  function setChainPair(
    uint64 _chainIdA,
    address _contractAddressA,
    uint64 _chainIdB,
    address _contractAddressB
  ) public onlyOperator {
    chainIdA = _chainIdA;
    contractAddressA = _contractAddressA;
    chainIdB = _chainIdB;
    contractAddressB = _contractAddressB;
  }

  function crossChain(
    uint64 _toChainId,
    bytes calldata _toContract,
    bytes calldata _method,
    bytes calldata _txData
  ) external override returns (bool) {
    uint64 fromChainId;
    address fromContractAddress;

    if (_toChainId == chainIdA) {
      fromChainId = chainIdB;
      fromContractAddress = contractAddressB;
    } else if (_toChainId == chainIdB) {
      fromChainId = chainIdA;
      fromContractAddress = contractAddressA;
    } else {
      revert("not support this peer");
    }

    address toContractAddress = Utils.bytesToAddress(_toContract);
    bytes memory fromContractAddressBytes = Utils.addressToBytes(fromContractAddress);
    require(
      MystikoWithPoly(toContractAddress).syncTx(_txData, fromContractAddressBytes, fromChainId),
      "call syncTx returns error"
    );
    return true;
  }

  function getEthCrossChainManager() external view override returns (address) {
    return address(this);
  }
}
