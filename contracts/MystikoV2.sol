// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./pool/AssetPool.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IWithdrawVerifier {
  function verifyProof(
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[3] memory input
  ) external returns (bool);
}

interface IRollupVerifier {
  function verifyProof(
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[4] memory input
  ) external returns (bool);
}

struct DepositLeaf {
  uint256 commitment;
  uint256 amount;
  uint256 rollupFee;
}

abstract contract MystikoV2 is AssetPool, ReentrancyGuard {
  uint256 public constant FIELD_SIZE =
    21888242871839275222246405745257275088548364400416034343698204186575808495617;

  // Verifier related.
  IWithdrawVerifier public withdrawVerifier;
  mapping(uint32 => IRollupVerifier) public rollupVerifiers;

  // For checking duplicates.
  mapping(uint256 => bool) public depositedCommitments;
  mapping(uint256 => bool) public spentSerialNumbers;

  // Deposit queue related.
  mapping(uint256 => DepositLeaf) public depositQueue;
  uint256 public depositQueueSize = 0;
  uint256 public depositQueueIndex = 0;

  // Deposit merkle tree roots;
  mapping(uint32 => uint256) public rootHistory;
  uint256 public currentRoot = 4506069241680023110764189603658664710592327039412547147745745078424755206435;
  uint32 public currentRootIndex = 0;
  uint32 public rootHistoryLength;

  // Admin related.
  address public operator;
  uint256 public minRollupFee;

  // Some switches.
  bool public isDepositsDisabled;
  bool public isVerifierUpdateDisabled;

  modifier onlyOperator() {
    require(msg.sender == operator, "Only operator can call this function.");
    _;
  }

  event EncryptedNote(uint256 indexed commitment, uint256 amount, bytes encryptedNote);
  event DepositQueued(uint256 indexed commitment, uint256 amount, uint256 rollupFee, uint256 leafIndex);
  event DepositIncluded(uint256 indexed commitment, uint256 amount, uint256 leafIndex);
  event Withdraw(address recipient, uint256 indexed rootHash, uint256 indexed serialNumber);

  constructor(
    address _withdrawVerifier,
    uint32 _rootHistoryLength,
    uint256 _minRollupFee
  ) public {
    require(_rootHistoryLength > 0, "_rootHistoryLength should be greater than 0");
    require(_minRollupFee > 0, "_minRollupFee should be greater than 0");
    withdrawVerifier = IWithdrawVerifier(_withdrawVerifier);
    operator = msg.sender;
    rootHistoryLength = _rootHistoryLength;
    minRollupFee = _minRollupFee;
    rootHistory[currentRootIndex] = currentRoot;
  }

  function deposit(
    uint256 amount,
    uint256 commitment,
    uint256 hashK,
    uint128 randomS,
    bytes memory encryptedNote,
    uint256 rollupFee
  ) public payable {
    require(!isDepositsDisabled, "deposits are disabled");
    require(!depositedCommitments[commitment], "the commitment has been submitted");
    uint256 calculatedCommitment = _commitmentHash(hashK, amount, randomS);
    require(commitment == calculatedCommitment, "commitment hash incorrect");
    require(rollupFee >= minRollupFee, "rollup fee too few");
    depositedCommitments[commitment] = true;
    _processDepositTransfer(amount + rollupFee);
    _processDeposit(amount, commitment, rollupFee);
    emit EncryptedNote(commitment, amount, encryptedNote);
  }

  function rollup(
    uint256[2] memory proofA,
    uint256[2][2] memory proofB,
    uint256[2] memory proofC,
    uint32 rollupSize,
    uint256 newRoot,
    uint32 pathIndices,
    uint256 leafHash
  ) public payable {
    require(!isKnownRoot(newRoot), "newRoot is duplicated");
    require(rollupSize <= depositQueueSize, "rollupSize too big");
    require(rollupVerifiers[rollupSize] != IRollupVerifier(0), "invalid rollupSize");
    bytes memory leavesData = new bytes(32 * rollupSize);
    uint256 totalRollupFee = 0;
    for (uint256 index = depositQueueIndex; index < depositQueueIndex + rollupSize; index++) {
      require(depositQueue[index].commitment != 0, "index out of bound");
      DepositLeaf memory leaf = depositQueue[index];
      uint256 commitment = leaf.commitment;
      totalRollupFee = totalRollupFee + leaf.rollupFee;
      assembly {
        let itemOffset := add(leavesData, mul(32, index))
        mstore(add(itemOffset, 0x20), commitment)
      }
      delete depositQueue[index];
      depositQueueSize = depositQueueSize - 1;
      emit DepositIncluded(commitment, leaf.amount, index);
    }
    uint256 expectedLeafHash = uint256(sha256(leavesData)) % FIELD_SIZE;
    require(leafHash == expectedLeafHash, "invalid leafHash");
    IRollupVerifier verifier = rollupVerifiers[rollupSize];
    bool verified = verifier.verifyProof(
      proofA,
      proofB,
      proofC,
      [currentRoot, newRoot, uint256(pathIndices), leafHash]
    );
    require(verified, "invalid proof");
    _processRollupFeeTransfer(totalRollupFee);
    depositQueueIndex = depositQueueIndex + rollupSize;
    currentRoot = newRoot;
    currentRootIndex = (currentRootIndex + 1) % rootHistoryLength;
    rootHistory[currentRootIndex] = newRoot;
  }

  function withdraw(
    uint256[2] memory proofA,
    uint256[2][2] memory proofB,
    uint256[2] memory proofC,
    uint256 rootHash,
    uint256 serialNumber,
    uint256 amount,
    address recipient
  ) public payable nonReentrant {
    require(!spentSerialNumbers[serialNumber], "The note has been already spent");
    require(isKnownRoot(rootHash), "Cannot find your merkle root");
    bool verified = withdrawVerifier.verifyProof(proofA, proofB, proofC, [rootHash, serialNumber, amount]);
    require(verified, "Invalid withdraw proof");
    spentSerialNumbers[serialNumber] = true;
    _processWithdrawTransfer(recipient, amount);
    emit Withdraw(recipient, rootHash, serialNumber);
  }

  function isKnownRoot(uint256 root) public view returns (bool) {
    uint32 i = currentRootIndex;
    do {
      if (root == rootHistory[i]) {
        return true;
      }
      if (i == 0) {
        i = rootHistoryLength;
      }
      i--;
    } while (i != currentRootIndex);
    return false;
  }

  function toggleDeposits(bool _state) external onlyOperator {
    isDepositsDisabled = _state;
  }

  function disableVerifierUpdate() external onlyOperator {
    isVerifierUpdateDisabled = true;
  }

  function setWithdrawVerifier(address _withdrawVerifier) external onlyOperator {
    require(!isVerifierUpdateDisabled, "Verifier updates have been disabled.");
    withdrawVerifier = IWithdrawVerifier(_withdrawVerifier);
  }

  function setRollupVerifier(uint32 rollupSize, address _rollupVerifier) external onlyOperator {
    rollupVerifiers[rollupSize] = IRollupVerifier(_rollupVerifier);
  }

  function changeOperator(address _newOperator) external onlyOperator {
    operator = _newOperator;
  }

  function setMinRollupFee(uint256 _minRollupFee) external onlyOperator {
    require(_minRollupFee > 0, "invalid _minRollupFee");
    minRollupFee = _minRollupFee;
  }

  function _commitmentHash(
    uint256 hashK,
    uint256 amount,
    uint128 randomS
  ) internal pure returns (uint256) {
    require(hashK < FIELD_SIZE, "hashK should be less than FIELD_SIZE");
    require(randomS < FIELD_SIZE, "randomS should be less than FIELD_SIZE");
    return uint256(sha256(abi.encodePacked(bytes32(hashK), bytes32(amount), bytes16(randomS)))) % FIELD_SIZE;
  }

  function _enqueueDeposit(
    uint256 commitment,
    uint256 amount,
    uint256 rollupFee
  ) internal {
    depositQueue[depositQueueSize] = DepositLeaf(commitment, amount, rollupFee);
    uint256 leafIndex = depositQueueIndex + depositQueueSize;
    depositQueueSize = depositQueueSize + 1;
    emit DepositQueued(commitment, amount, rollupFee, leafIndex);
  }

  function _processDeposit(
    uint256 amount,
    uint256 commitment,
    uint256 rollupFee
  ) internal virtual;

  function bridgeType() public view virtual returns (string memory);
}
