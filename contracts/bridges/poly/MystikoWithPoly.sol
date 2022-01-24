// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "../../Mystiko.sol";
import "./cross_chain_manager/interface/IEthCrossChainManager.sol";
import "./cross_chain_manager/interface/IEthCrossChainManagerProxy.sol";
import "../CrossChainDataSerializable.sol";

abstract contract MystikoWithPoly is Mystiko, CrossChainDataSerializable {
  IEthCrossChainManagerProxy public eccmp;
  uint64 public peerChainId;
  address public peerContractAddress;

  constructor(
    address _eccmp,
    uint64 _peerChainId,
    address _verifier,
    address _hasher,
    uint32 _merkleTreeHeight
  ) public Mystiko(_verifier, _hasher, _merkleTreeHeight) {
    eccmp = IEthCrossChainManagerProxy(_eccmp);
    peerChainId = _peerChainId;
    peerContractAddress = address(0);
  }

  modifier onlyManagerContract() {
    require(msg.sender == eccmp.getEthCrossChainManager(), "msgSender is not EthCrossChainManagerContract");
    _;
  }

  function syncTx(
    bytes memory txDataBytes,
    bytes memory fromContractAddr,
    uint64 fromChainId
  ) public onlyManagerContract returns (bool) {
    CrossChainData memory txData = deserializeTxData(txDataBytes);
    require(fromContractAddr.length != 0, "from proxy contract address cannot be empty");
    require(Utils.bytesToAddress(fromContractAddr) == peerContractAddress, "from proxy address not matched");
    require(fromChainId == peerChainId, "from chain id not matched");
    require(txData.amount > 0, "amount shouuld be greater than 0");
    uint32 leafIndex = _insert(txData.commitmentHash);
    emit MerkleTreeInsert(txData.commitmentHash, leafIndex, txData.amount);
    return true;
  }

  function _processCrossChain(uint256 amount, bytes32 commitmentHash) internal override {
    CrossChainData memory txData = CrossChainData({amount: amount, commitmentHash: commitmentHash});
    bytes memory txDataBytes = serializeTxData(txData);
    IEthCrossChainManager eccm = IEthCrossChainManager(eccmp.getEthCrossChainManager());
    require(
      eccm.crossChain(peerChainId, Utils.addressToBytes(peerContractAddress), "syncTx", txDataBytes),
      "eccm returns error"
    );
  }

  function bridgeType() public view override returns (string memory) {
    return "poly";
  }

  function setECCMProxy(address _eccmp) external onlyOperator {
    eccmp = IEthCrossChainManagerProxy(_eccmp);
  }

  function setPeerContractAddress(address _peerContractAddress) external onlyOperator {
    peerContractAddress = _peerContractAddress;
  }
}
