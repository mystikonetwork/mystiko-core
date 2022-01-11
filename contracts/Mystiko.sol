// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./merkle/MerkleTreeWithHistory.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IVerifier {
  function verifyProof(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c, uint[3] memory input) external returns (bool);
}

abstract contract Mystiko is MerkleTreeWithHistory, ReentrancyGuard {
  using SafeERC20 for IERC20Metadata;

  enum ProtocolType { CROSS_CHAIN, SAME_CHAIN }

  IVerifier public verifier;
  IERC20Metadata public token;
  mapping(bytes32 => bool) public depositedCommitments;
  mapping(bytes32 => bool) public withdrewSerialNumbers;

  address public operator;
  bool public isDepositsDisabled;
  bool public isVerifierUpdateDisabled;
  ProtocolType public protocolType;

  modifier onlyOperator {
    require(msg.sender == operator, "Only operator can call this function.");
    _;
  }

  event Deposit(uint256 amount, bytes32 indexed commitmentHash, bytes encryptedNotes, uint256 timestamp);
  event MerkleTreeInsert(bytes32 indexed leaf, uint32 leafIndex, uint256 amount);
  event Withdraw(address recipient, bytes32 indexed rootHash, bytes32 indexed serialNumber);

  constructor(
    address _verifier,
    address _token,
    address _hasher,
    uint32 _merkleTreeHeight,
    ProtocolType _protocolType
  ) MerkleTreeWithHistory(_merkleTreeHeight, _hasher) {
    verifier = IVerifier(_verifier);
    token = IERC20Metadata(_token);
    operator = msg.sender;
    protocolType = _protocolType;
  }

  function deposit(uint256 amount, bytes32 commitmentHash, bytes memory encryptedNotes)
    public payable {
    require(!isDepositsDisabled, "deposits are disabled");
    require(!depositedCommitments[commitmentHash], "The commitment has been submitted");
    require(amount > 0, "amount should be greater than 0");
    uint256 allownce  = token.allowance(msg.sender, address(this));
    require(allownce >= amount, "insufficient allowance for given token");
    token.safeTransferFrom(msg.sender, address(this), amount);
    depositedCommitments[commitmentHash] = true;
    _processCrossChain(amount, commitmentHash);
    emit Deposit(amount, commitmentHash, encryptedNotes, block.timestamp);
  }

  function withdraw(
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    bytes32 rootHash,
    bytes32 serialNumber,
    uint256 amount,
    address recipient) public payable nonReentrant {
    require(!withdrewSerialNumbers[serialNumber], "The note has been already spent");
    require(isKnownRoot(rootHash), "Cannot find your merkle root");
    require(verifier.verifyProof(a, b, c,
      [uint256(rootHash), uint256(serialNumber), amount]), "Invalid withdraw proof");
    withdrewSerialNumbers[serialNumber] = true;
    token.safeTransfer(recipient, amount);
    emit Withdraw(recipient, rootHash, serialNumber);
  }

  function _processCrossChain(
    uint256 amount, bytes32 commitmentHash) internal virtual;

  function isSpent(bytes32 serialNumber) public view returns(bool) {
    return withdrewSerialNumbers[serialNumber];
  }

  function getToken() public view returns(address) {
    return address(token);
  }

  function getTokenName() public view returns(string memory) {
    return token.name();
  }

  function getTokenSymbol() public view returns(string memory) {
    return token.symbol();
  }

  function getTokenDecimals() public view returns(uint8) {
    return token.decimals();
  }

  function getVerifierAddress() public view returns(address) {
    return address(verifier);
  }

  function getProtocolType() public view returns(ProtocolType) {
    return protocolType;
  }

  function getHasherAddress() public view returns(address) {
    return address(hasher);
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
}