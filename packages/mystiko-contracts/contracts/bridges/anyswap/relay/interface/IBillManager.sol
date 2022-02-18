// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;
pragma experimental ABIEncoderV2;

interface IBillManager {
  function anyCall(
    address[] memory to,
    bytes[] memory data,
    address[] memory fallbacks,
    uint256[] memory nonces,
    uint256 toChainID
  ) external;
}
