// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;
pragma experimental ABIEncoderV2;

import "../bridges/anyswap/relay/interface/IBillManager.sol";
import "../bridges/anyswap/MystikoWithAnyswap.sol";

contract AnyswapBillManagerMock is IBillManager {
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

  function anyCall(
    address[] memory to,
    bytes[] memory data,
    address[] memory fallbacks,
    uint256[] memory nonces,
    uint256 toChainID
  ) external override {
    uint256 fromChainId;
    address fromContractAddress;

    if (toChainID == chainIdA) {
      fromChainId = chainIdB;
      fromContractAddress = contractAddressB;
    } else if (toChainID == chainIdB) {
      fromChainId = chainIdA;
      fromContractAddress = contractAddressA;
    } else {
      revert("not support this peer");
    }

    require(
      MystikoWithAnySwap(to[0]).anyCall(fromContractAddress, to, data, fallbacks, nonces, fromChainId),
      "call anyCall returns error"
    );
    return;
  }
}
