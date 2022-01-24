// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "../libs/common/ZeroCopySink.sol";
import "../libs/common/ZeroCopySource.sol";
import "../libs/utils/Utils.sol";

struct CrossChainData {
  uint256 amount;
  bytes32 commitmentHash;
}

abstract contract CrossChainDataSerializable {
  function serializeTxData(CrossChainData memory data) internal pure returns (bytes memory) {
    bytes memory buff;
    buff = abi.encodePacked(
      ZeroCopySink.WriteUint255(data.amount),
      ZeroCopySink.WriteVarBytes(abi.encodePacked(data.commitmentHash))
    );
    return buff;
  }

  function deserializeTxData(bytes memory rawData) internal pure returns (CrossChainData memory) {
    CrossChainData memory data;
    uint256 off = 0;
    (data.amount, off) = ZeroCopySource.NextUint255(rawData, off);
    bytes memory tempBytes;
    (tempBytes, off) = ZeroCopySource.NextVarBytes(rawData, off);
    data.commitmentHash = Utils.bytesToBytes32(tempBytes);
    return data;
  }
}
