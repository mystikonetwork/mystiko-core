// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AssetPool.sol";
import "./IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract ERC20AssetPool is AssetPool {
  using SafeERC20 for IERC20Metadata;
  IERC20Metadata public asset;

  constructor(address _assetAddress) {
    asset = IERC20Metadata(_assetAddress);
  }

  function _processDepositTransfer(uint256 amount, uint256 bridgeFee) internal virtual override {
    require(msg.value == bridgeFee, "bridge fee mismatch");
    asset.safeTransferFrom(msg.sender, address(this), amount);
  }

  function _processExecutorFeeTransfer(uint256 amount) internal override {
    asset.safeTransfer(tx.origin, amount);
  }

  function _processRollupFeeTransfer(uint256 amount) internal override {
    asset.safeTransfer(msg.sender, amount);
  }

  function _processWithdrawTransfer(address recipient, uint256 amount) internal override {
    asset.safeTransfer(recipient, amount);
  }

  function assetType() public pure override returns (string memory) {
    return "erc20";
  }

  function assetName() public view returns (string memory) {
    return asset.name();
  }

  function assetSymbol() public view returns (string memory) {
    return asset.symbol();
  }

  function assetDecimals() public view returns (uint8) {
    return asset.decimals();
  }
}
