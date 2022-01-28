// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "../bridges/celer/relay/interface/IMessageReceiverApp.sol";
import "../bridges/celer/relay/interface/IMessageSenderApp.sol";
import "../bridges/celer/MystikoWithCeler.sol";
import "../libs/utils/Utils.sol";

contract CelerMessageBusMock is IMessageReceiverApp, IMessageSenderApp {
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
    uint64 _dstChainId,
    bytes memory _message,
    uint256 _fee
  ) external override {
    uint64 fromChainId;
    address fromContractAddress;
    _fee;

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
  ) external override returns (bytes32) {
    _receiver;
    _token;
    _amount;
    _dstChainId;
    _nonce;
    _maxSlippage;
    _message;
    _bridgeType;
    _fee;
    return 0;
  }

  function sendTokenTransfer(
    address _receiver,
    address _token,
    uint256 _amount,
    uint64 _dstChainId,
    uint64 _nonce,
    uint32 _maxSlippage,
    MessageSenderLib.BridgeType _bridgeType
  ) external override {
    _receiver;
    _token;
    _amount;
    _dstChainId;
    _nonce;
    _maxSlippage;
    _bridgeType;
    return;
  }

  function executeMessage(
    address _sender,
    uint64 _srcChainId,
    bytes calldata _message
  ) external payable override returns (bool) {
    _sender;
    _srcChainId;
    _message;
    return true;
  }
}
