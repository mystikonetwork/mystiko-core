// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./merkle/MerkleTreeWithHistory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IVerifier {
  function verifyProof(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c, uint[5] memory input) external returns (bool);
}

abstract contract Mystiko is MerkleTreeWithHistory, ReentrancyGuard {
  using SafeERC20 for IERC20;

  IVerifier public verifier;
  IERC20 public token;
  mapping(bytes32 => bool) public depositedCommitments;
  mapping(bytes32 => bool) public withdrewSerialNumbers;

  address public operator;
  bool public isDepositsDisabled;
  bool public isVerifierUpdateDisabled;
  modifier onlyOperator {
    require(msg.sender == operator, "Only operator can call this function.");
    _;
  }

  event Deposit(
    uint64 toChainId, uint256 amount,
    bytes32 indexed commitmentHash, bytes encryptedNotes,
    uint256 leafIndex, uint256 timestamp);

  constructor(
    IVerifier _verifier,
    address _token,
    IHasher _hasher,
    uint32 _merkleTreeHeight,
    address _operator
  ) MerkleTreeWithHistory(_merkleTreeHeight, _hasher) {
    verifier = _verifier;
    token = IERC20(_token);
    operator = _operator;
  }

  function deposit(
    uint64 toChainId, uint256 amount,
    bytes32 commitmentHash, bytes memory encryptedNotes) public payable {
    require(!isDepositsDisabled, "deposits are disabled");
    require(!depositedCommitments[commitmentHash], "The commitment has been submitted");
    require(amount > 0, "amount should be greater than 0");
    uint256 allownce  = token.allowance(msg.sender, address(this));
    require(allownce >= amount, "insufficient allowance for given token");
    token.safeTransferFrom(msg.sender, address(this), amount);
    uint256 insertedIndex = _insert(commitmentHash);
    _processCrossChain(
      toChainId, amount, commitmentHash, encryptedNotes);
    emit Deposit(toChainId, amount,
      commitmentHash, encryptedNotes, insertedIndex, block.timestamp);
  }

  function _processCrossChain(
    uint64 toChainId, uint256 amount,
    bytes32 commitmentHash, bytes memory encryptedNotes) internal virtual;

  function isSpent(bytes32 serialNumber) public view returns(bool) {
    return withdrewSerialNumbers[serialNumber];
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