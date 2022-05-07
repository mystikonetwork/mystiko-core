// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../libs/asset/AssetPool.sol";
import "../../../interface/IMystikoBridge.sol";
import "../../../interface/IHasher3.sol";
import "../../../interface/ICommitmentPool.sol";
import "./CrossChainDataSerializable.sol";
import "../../rule/Sanctions.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

abstract contract MystikoV2Bridge is IMystikoBridge, AssetPool, CrossChainDataSerializable, Sanctions {
  uint256 FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

  // Hasher related.
  IHasher3 hasher3;

  address associatedCommitmentPool;
  uint64 peerChainId;
  address peerContract;

  //bridge proxy address
  address bridgeProxyAddress;

  //local chain fee
  uint256 minAmount;
  uint256 minBridgeFee;
  uint256 minExecutorFee;

  //remote chain fee
  uint256 peerMinExecutorFee;
  uint256 peerMinRollupFee;

  // Admin related.
  address operator;

  // Some switches.
  bool depositsDisabled;

  modifier onlyOperator() {
    require(msg.sender == operator, "only operator.");
    _;
  }

  modifier onlyBridgeProxy() {
    require(msg.sender == bridgeProxyAddress, "msg sender is not bridge proxy");
    _;
  }

  event CommitmentCrossChain(uint256 indexed commitment);

  constructor(address _hasher3) {
    operator = msg.sender;
    hasher3 = IHasher3(_hasher3);
  }

  function setBridgeProxyAddress(address _bridgeProxyAddress) external onlyOperator {
    bridgeProxyAddress = _bridgeProxyAddress;
  }

  function setMinAmount(uint256 _minAmount) external onlyOperator {
    minAmount = _minAmount;
  }

  function setMinBridgeFee(uint256 _minBridgeFee) external onlyOperator {
    minBridgeFee = _minBridgeFee;
  }

  function setMinExecutorFee(uint256 _minExecutorFee) external onlyOperator {
    require(_minExecutorFee > 0, "invalid minimal executor fee");
    minExecutorFee = _minExecutorFee;
  }

  function setPeerMinExecutorFee(uint256 _peerMinExecutorFee) external onlyOperator {
    require(_peerMinExecutorFee > 0, "invalid peer minimal executor fee");
    peerMinExecutorFee = _peerMinExecutorFee;
  }

  function setPeerMinRollupFee(uint256 _peerMinRollupFee) external onlyOperator {
    require(_peerMinRollupFee > 0, "invalid peer minimal rollup fee");
    peerMinRollupFee = _peerMinRollupFee;
  }

  function setAssociatedCommitmentPool(address _commitmentPoolAddress) external onlyOperator {
    associatedCommitmentPool = _commitmentPoolAddress;
  }

  function setPeerContract(uint64 _peerChainId, address _peerContract) external onlyOperator {
    peerChainId = _peerChainId;
    peerContract = _peerContract;
  }

  function _commitmentHash(
    uint256 _hashK,
    uint256 _amount,
    uint128 _randomS
  ) internal view returns (uint256) {
    require(_hashK < FIELD_SIZE, "hashK should be less than FIELD_SIZE");
    require(_amount < FIELD_SIZE, "randomS should be less than FIELD_SIZE");
    return hasher3.poseidon([_hashK, _amount, uint256(_randomS)]);
  }

  function deposit(DepositRequest memory _request) external payable override {
    require(!depositsDisabled, "deposits are disabled");
    require(_request.amount >= minAmount, "amount too few");
    require(_request.bridgeFee >= minBridgeFee, "bridge fee too few");
    require(_request.executorFee >= peerMinExecutorFee, "executor fee too few");
    require(_request.rollupFee >= peerMinRollupFee, "rollup fee too few");
    uint256 calculatedCommitment = _commitmentHash(_request.hashK, _request.amount, _request.randomS);
    require(_request.commitment == calculatedCommitment, "commitment hash incorrect");
    require(!isSanctioned(msg.sender), "sanctioned address");

    // todo check commitment ?

    _processDepositTransfer(
      associatedCommitmentPool,
      _request.amount + _request.executorFee + _request.rollupFee,
      _request.bridgeFee
    );

    ICommitmentPool.CommitmentRequest memory cmRequest = ICommitmentPool.CommitmentRequest({
      amount: _request.amount,
      commitment: _request.commitment,
      executorFee: _request.executorFee,
      rollupFee: _request.rollupFee,
      encryptedNote: _request.encryptedNote
    });

    bytes memory cmRequestBytes = serializeTxData(cmRequest);

    _processDeposit(_request.bridgeFee, cmRequestBytes);
    emit CommitmentCrossChain(_request.commitment);
  }

  function _processDeposit(uint256 _bridgeFee, bytes memory _requestBytes) internal virtual;

  function bridgeCommitment(
    uint64 _fromChainId,
    address _fromContract,
    address _executor,
    ICommitmentPool.CommitmentRequest memory _request
  ) internal {
    require(_fromContract == peerContract, "from proxy address not matched");
    require(_fromChainId == peerChainId, "from chain id not matched");
    require(_request.amount > 0, "amount should be greater than 0");
    require(_request.executorFee >= minExecutorFee, "executor fee too few");
    require(ICommitmentPool(associatedCommitmentPool).enqueue(_request, _executor), "call enqueue error");
  }

  function toggleDeposits(bool _state) external onlyOperator {
    depositsDisabled = _state;
  }

  function changeOperator(address _newOperator) external onlyOperator {
    operator = _newOperator;
  }

  function toggleSanctionCheck(bool _check) external onlyOperator {
    sanctionCheckDisabled = _check;
  }

  function updateSanctionContractAddress(address _sanction) external onlyOperator {
    sanctionsContract = _sanction;
  }

  function bridgeType() public pure virtual returns (string memory);

  function getMinAmount() public view returns (uint256) {
    return minAmount;
  }

  function getMinBridgeFee() public view returns (uint256) {
    return minBridgeFee;
  }

  function getMinExecutorFee() public view returns (uint256) {
    return minExecutorFee;
  }

  function getPeerMinExecutorFee() public view returns (uint256) {
    return peerMinExecutorFee;
  }

  function getPeerMinRollupFee() public view returns (uint256) {
    return peerMinRollupFee;
  }

  function isDepositsDisabled() public view returns (bool) {
    return depositsDisabled;
  }
}
