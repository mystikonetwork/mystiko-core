// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

library MessageSenderLib {
  enum BridgeType {
    Null,
    Liquidity,
    PegDeposit,
    PegBurn
  }
}

interface IMessageSenderApp {
  /**
   * @notice Sends a message to an app on another chain via MessageBus without an associated transfer.
   * @param _receiver The address of the destination app contract.
   * @param _dstChainId The destination chain ID.
   * @param _message Arbitrary message bytes to be decoded by the destination app contract.
   */
  function sendMessage(
    address _receiver,
    uint256 _dstChainId,
    bytes memory _message
  ) external payable;

  /**
   * @notice Sends a message to an app on another chain via MessageBus with an associated transfer.
   * @param _receiver The address of the destination app contract.
   * @param _token The address of the token to be sent.
   * @param _amount The amount of tokens to be sent.
   * @param _dstChainId The destination chain ID.
   * @param _nonce A number input to guarantee uniqueness of transferId. Can be timestamp in practice.
   * @param _maxSlippage The max slippage accepted, given as percentage in point (pip). Eg. 5000 means 0.5%.
   * Must be greater than minimalMaxSlippage. Receiver is guaranteed to receive at least (100% - max slippage percentage) * amount or the
   * transfer can be refunded. Only applicable to the {BridgeType.Liquidity}.
   * @param _message Arbitrary message bytes to be decoded by the destination app contract.
   * @param _bridgeType One of the {BridgeType} enum.
   * @param _fee The fee amount to pay to MessageBus.
   */
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
  ) external payable;
}
