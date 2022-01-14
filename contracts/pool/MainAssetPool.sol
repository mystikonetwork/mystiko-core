// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./AssetPool.sol";

abstract contract MainAssetPool is AssetPool {
  function _processDepositTransfer(uint256 amount) internal override {
    require(msg.value == amount, "please send the given amount of mainnet token with this transaction");
  }

  function _processWithdrawTransfer(address recipient, uint256 amount) internal override {
    require(msg.value == 0, "message value is supposed to be zero for withdraw operation");
    (bool success, ) = recipient.call{ value: amount }("");
    require(success, "payment to recipient did not go well");
  }
}