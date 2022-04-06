// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../libs/common/ZeroCopySink.sol";
import "../../libs/common/ZeroCopySource.sol";
import "../../libs/utils/Utils.sol";

struct CrossChainData {
  uint256 amount;
  uint256 commitment;
  uint256 executorFee;
  uint256 rollupFee;
}

abstract contract CrossChainDataSerializable {
  function serializeTxData(CrossChainData memory data) internal pure returns (bytes memory) {
    bytes memory buff;
    buff = abi.encodePacked(
      ZeroCopySink.WriteUint255(data.amount),
      ZeroCopySink.WriteUint255(data.commitment),
      ZeroCopySink.WriteUint255(data.executorFee),
      ZeroCopySink.WriteUint255(data.rollupFee)
    );
    return buff;
  }

  function deserializeTxData(bytes memory rawData) internal pure returns (CrossChainData memory) {
    CrossChainData memory data;
    uint256 off = 0;
    (data.amount, off) = ZeroCopySource.NextUint255(rawData, off);
    (data.commitment, off) = ZeroCopySource.NextUint255(rawData, off);
    (data.executorFee, off) = ZeroCopySource.NextUint255(rawData, off);
    (data.rollupFee, off) = ZeroCopySource.NextUint255(rawData, off);
    return data;
  }
}
