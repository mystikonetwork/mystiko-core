// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../Mystiko.sol";
import "./cross_chain_manager/interface/IEthCrossChainManager.sol";
import "./cross_chain_manager/interface/IEthCrossChainManagerProxy.sol";
import "../../libs/common/ZeroCopySink.sol";
import "../../libs/common/ZeroCopySource.sol";
import "../../libs/utils/Utils.sol";

contract MystikoWithPoly is Mystiko {
  IEthCrossChainManagerProxy public eccmp;
  uint64 public peerChainId;
  bytes public peerChainContract;

  struct CrossChainData {
    uint256 amount;
    bytes32 commitmentHash;
  }

  constructor(
    address _eccmp,
    uint64 _peerChainId,
    address _verifier,
    address _token,
    address _hasher,
    uint32 _merkleTreeHeight
  ) Mystiko(_verifier, _token, _hasher, _merkleTreeHeight) {
    eccmp = IEthCrossChainManagerProxy(_eccmp);
    peerChainId = _peerChainId;
    peerChainContract = new bytes(0);
  }

  modifier onlyManagerContract() {
    require(msg.sender == eccmp.getEthCrossChainManager(), "msgSender is not EthCrossChainManagerContract");
    _;
  }

  function syncTx(bytes memory txDataBytes, bytes memory fromContractAddr, uint64 fromChainId)
    onlyManagerContract public returns (bool) {
    CrossChainData memory txData = _deserializeTxData(txDataBytes);
    require(fromContractAddr.length != 0, "from proxy contract address cannot be empty");
    require(Utils.bytesToAddress(fromContractAddr) == Utils.bytesToAddress(peerChainContract), "from proxy address not matched");
    require(fromChainId == peerChainId, "from chain id not matched");
    require(txData.amount > 0, "amount shouuld be greater than 0");
    uint32 leafIndex = _insert(txData.commitmentHash);
    emit MerkleTreeInsert(txData.commitmentHash, leafIndex, txData.amount);
    return true;
  }

  function _processCrossChain(
    uint256 amount, bytes32 commitmentHash) internal override {
    CrossChainData memory txData = CrossChainData({
      amount: amount,
      commitmentHash: commitmentHash
    });
    bytes memory txDataBytes = _serializeTxData(txData);
    IEthCrossChainManager eccm = IEthCrossChainManager(eccmp.getEthCrossChainManager());
    require(eccm.crossChain(peerChainId, peerChainContract, "syncTx", txDataBytes), "eccm returns error");
  }

  function _serializeTxData(CrossChainData memory data) internal pure returns(bytes memory) {
    bytes memory buff;
    buff = abi.encodePacked(
      ZeroCopySink.WriteUint255(data.amount),
      ZeroCopySink.WriteVarBytes(abi.encodePacked(data.commitmentHash))
    );
    return buff;
  }

  function _deserializeTxData(bytes memory rawData) internal pure returns(CrossChainData memory) {
    CrossChainData memory data;
    uint256 off = 0;
    (data.amount, off) = ZeroCopySource.NextUint255(rawData, off);
    bytes memory tempBytes;
    (tempBytes, off) = ZeroCopySource.NextVarBytes(rawData, off);
    data.commitmentHash = Utils.bytesToBytes32(tempBytes);
    return data;
  }

  function getECCMProxyAddress() public view returns(address) {
    return address(eccmp);
  }

  function getPeerChainId() public view returns(uint64) {
    return peerChainId;
  }

  function getPeerChainiContractAddress() public view returns(bytes memory) {
    return peerChainContract;
  }

  function setECCMProxy(address _eccmp) external onlyOperator {
    eccmp = IEthCrossChainManagerProxy(_eccmp);
  }

  function setPeerChainContract(bytes memory _peerChainContract) external onlyOperator {
    peerChainContract = _peerChainContract;
  }
}