// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

abstract contract AssetPool {
  function _processDepositTransfer(uint256 amount) internal virtual;

  function _processRollupFeeTransfer(uint256 amount) internal virtual;

  function _processWithdrawTransfer(address recipient, uint256 amount) internal virtual;

  function assetType() public view virtual returns (string memory);
}
