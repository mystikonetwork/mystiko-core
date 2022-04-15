// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../libs/asset/AssetPool.sol";
import "../../../interface/IMystikoBridge.sol";
import "../../../interface/IHasher3.sol";
import "../../../interface/ICommitmentPool.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

abstract contract MystikoV2Bridge is IMystikoBridge, AssetPool {
  uint256 public constant FIELD_SIZE =
    21888242871839275222246405745257275088548364400416034343698204186575808495617;

  // Hasher related.
  IHasher3 public hasher3;

  address public associatedCommitmentPool;
  uint256 public peerChainId;
  address public peerContract;

  //bridge proxy address
  address public bridgeProxyAddress;

  //local chain fee
  uint256 public minBridgeFee;
  uint256 public minExecutorFee;
  uint256 public minRollupFee;

  //remote chain fee
  uint256 public peerMinExecutorFee;
  uint256 public peerMinRollupFee;

  // Admin related.
  address public operator;

  // Some switches.
  bool public isDepositsDisabled;

  modifier onlyOperator() {
    require(msg.sender == operator, "Only operator can call this function.");
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

  function setMinBridgeFee(uint256 _minBridgeFee) external onlyOperator {
    minBridgeFee = _minBridgeFee;
  }

  function setMinExecutorFee(uint256 _minExecutorFee) external onlyOperator {
    require(_minExecutorFee > 0, "invalid minimal executor fee");
    minExecutorFee = _minExecutorFee;
  }

  function setMinRollupFee(uint256 _minRollupFee) external onlyOperator {
    require(_minRollupFee > 0, "invalid minimal rollup fee");
    minRollupFee = _minRollupFee;
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

  function setpeerContract(uint256 _peerChainId, address _peerContract) external onlyOperator {
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
    require(!isDepositsDisabled, "deposits are disabled");
    require(_request.amount > 0, "amount should be greater than 0");
    require(_request.bridgeFee >= minBridgeFee, "bridge fee too few");
    require(_request.executorFee >= peerMinExecutorFee, "executor fee too few");
    require(_request.rollupFee >= peerMinRollupFee, "rollup fee too few");
    uint256 calculatedCommitment = _commitmentHash(_request.hashK, _request.amount, _request.randomS);
    require(_request.commitment == calculatedCommitment, "commitment hash incorrect");

    // todo check commitment ?
    _processDeposit(
      _request.amount,
      _request.commitment,
      _request.bridgeFee,
      _request.executorFee,
      _request.rollupFee,
      _request.encryptedNote
    );
    emit CommitmentCrossChain(_request.commitment);
  }

  function _processDeposit(
    uint256 _amount,
    uint256 _commitment,
    uint256 _bridgeFee,
    uint256 _executeFee,
    uint256 _rollupFee,
    bytes memory _encryptedNote
  ) internal virtual;

  function bridgeCommitment(
    uint256 _fromChainId,
    address _fromContract,
    ICommitmentPool.CommitmentRequest memory _request
  ) external override onlyBridgeProxy returns (bool) {
    require(_fromContract == peerContract, "from proxy address not matched");
    require(_fromChainId == peerChainId, "from chain id not matched");
    require(_request.amount > 0, "amount should be greater than 0");
    require(_request.executorFee >= minExecutorFee, "executor fee too few");
    require(_request.rollupFee >= minRollupFee, "rollup fee too few");
    require(
      ICommitmentPool(associatedCommitmentPool).inputCommitment(_request),
      "core call inputCommitment error"
    );

    _processExecutorFeeTransfer(_request.executorFee);
    return true;
  }

  function toggleDeposits(bool _state) external onlyOperator {
    isDepositsDisabled = _state;
  }

  function changeOperator(address _newOperator) external onlyOperator {
    operator = _newOperator;
  }

  function bridgeType() public pure virtual returns (string memory);
}
