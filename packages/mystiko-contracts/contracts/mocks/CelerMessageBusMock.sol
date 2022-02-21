// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "../bridges/celer/relay/interface/IMessageReceiverApp.sol";
import "../bridges/celer/relay/interface/IMessageSenderApp.sol";
import "../bridges/celer/MystikoWithCeler.sol";
import "../libs/utils/Utils.sol";

contract CelerMessageBusMock is IMessageSenderApp {
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

  function sendMessage(
    address _receiver,
    uint256 _dstChainId,
    bytes memory _message
  ) external payable override {
    uint64 fromChainId;
    address fromContractAddress;
    require(msg.value >= 0, "require bridge fee");

    if (_dstChainId == chainIdA) {
      fromChainId = chainIdB;
      fromContractAddress = contractAddressB;
    } else if (_dstChainId == chainIdB) {
      fromChainId = chainIdA;
      fromContractAddress = contractAddressA;
    } else {
      revert("not support this peer");
    }

    require(
      MystikoWithCeler(_receiver).executeMessage(fromContractAddress, fromChainId, _message),
      "call executeMessage returns error"
    );
    return;
  }

  function sendMessageWithTransfer(
    address _receiver,
    address _token,
    uint256 _amount,
    uint64 _dstChainId,
    uint64 _nonce,
    uint32 _maxSlippage,
    bytes memory _message,
    MessageSenderLib.BridgeType _bridgeType,
    uint256 _fee
  ) external payable override {
    _receiver;
    _token;
    _amount;
    _dstChainId;
    _nonce;
    _maxSlippage;
    _message;
    _bridgeType;
    _fee;
    return;
  }
}
