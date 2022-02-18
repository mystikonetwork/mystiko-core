// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./merkle/MerkleTreeWithHistory.sol";
import "./pool/AssetPool.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVerifier {
  function verifyProof(
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[4] memory input
  ) external returns (bool);
}

abstract contract Mystiko is MerkleTreeWithHistory, AssetPool, ReentrancyGuard {
  IVerifier public verifier;
  mapping(bytes32 => bool) public depositedCommitments;
  mapping(bytes32 => bool) public relayCommitments;
  mapping(uint256 => bool) public withdrewSerialNumbers;

  address public operator;
  address public relayProxyAddress;
  uint64 public peerChainId;
  address public peerContractAddress;

  bool public isDepositsDisabled;
  bool public isVerifierUpdateDisabled;

  modifier onlyOperator() {
    require(msg.sender == operator, "Only operator can call this function.");
    _;
  }

  event Deposit(uint256 amount, bytes32 indexed commitmentHash, bytes encryptedNote);
  event MerkleTreeInsert(bytes32 indexed leaf, uint32 leafIndex, uint256 amount);
  event Withdraw(address recipient, uint256 indexed rootHash, uint256 indexed serialNumber);

  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    address _verifier,
    address _hasher2,
    uint32 _merkleTreeHeight
  ) public MerkleTreeWithHistory(_merkleTreeHeight, _hasher2) {
    relayProxyAddress = _relayProxyAddress;
    peerChainId = _peerChainId;
    verifier = IVerifier(_verifier);
    operator = msg.sender;
    peerContractAddress = address(0);
  }

  function deposit(
    uint256 amount,
    bytes32 commitmentHash,
    bytes32 hashK,
    bytes16 randomS,
    bytes memory encryptedNote
  ) public payable {
    require(!isDepositsDisabled, "deposits are disabled");
    require(!depositedCommitments[commitmentHash], "The commitment has been submitted");
    uint256 cHash = uint256(sha256(abi.encodePacked(hashK, amount, randomS))) % FIELD_SIZE;
    require(bytes32(cHash) == commitmentHash, "commitment hash incorrect");
    _processDepositTransfer(amount);
    depositedCommitments[commitmentHash] = true;
    _sendCrossChainTx(amount, commitmentHash);
    emit Deposit(amount, commitmentHash, encryptedNote);
  }

  function withdraw(
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256 rootHash,
    uint256 serialNumber,
    uint256 amount,
    address recipient
  ) public payable nonReentrant {
    require(!withdrewSerialNumbers[serialNumber], "The note has been already spent");
    require(isKnownRoot(bytes32(rootHash)), "Cannot find your merkle root");
    uint256 recipientNumber = uint256(uint160(recipient));
    require(
      verifier.verifyProof(a, b, c, [rootHash, serialNumber, amount, recipientNumber]),
      "Invalid withdraw proof"
    );
    withdrewSerialNumbers[serialNumber] = true;
    _processWithdrawTransfer(recipient, amount);
    emit Withdraw(recipient, rootHash, serialNumber);
  }

  function _sendCrossChainTx(uint256 amount, bytes32 commitmentHash) internal virtual;

  function bridgeType() public view virtual returns (string memory);

  function isSpent(uint256 serialNumber) public view returns (bool) {
    return withdrewSerialNumbers[serialNumber];
  }

  function getVerifierAddress() public view returns (address) {
    return address(verifier);
  }

  function getHasherAddress() public view returns (address) {
    return address(hasher);
  }

  function getIsDepositsDisabled() public view returns (bool) {
    return isDepositsDisabled;
  }

  function toggleDeposits(bool _state) external onlyOperator {
    isDepositsDisabled = _state;
  }

  function updateVerifier(address _newVerifier) external onlyOperator {
    require(!isVerifierUpdateDisabled, "Verifier updates have been disabled.");
    verifier = IVerifier(_newVerifier);
  }

  function disableVerifierUpdate() external onlyOperator {
    isVerifierUpdateDisabled = true;
  }

  function changeOperator(address _newOperator) external onlyOperator {
    operator = _newOperator;
  }

  function setRelayProxyAddress(address _relayProxyAddress) external onlyOperator {
    relayProxyAddress = _relayProxyAddress;
  }

  function setPeerContractAddress(address _peerContractAddress) external onlyOperator {
    peerContractAddress = _peerContractAddress;
  }
}