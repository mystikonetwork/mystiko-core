// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../libs/asset/AssetPool.sol";
import "../../interface/IHasher3.sol";
import "../../interface/IVerifier.sol";
import "../../interface/IMystikoBridge.sol";
import "./CrossChainDataSerializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

struct CommitmentLeaf {
  uint256 commitment;
  uint256 rollupFee;
}

struct WrappedVerifier {
  IVerifier verifier;
  bool enabled;
}

abstract contract MystikoBridge is IMystikoBridge, AssetPool, CrossChainDataSerializable, ReentrancyGuard {
  uint256 public constant FIELD_SIZE =
    21888242871839275222246405745257275088548364400416034343698204186575808495617;

  // Hasher related.
  IHasher3 public hasher3;

  // Verifier related.
  mapping(uint32 => mapping(uint32 => WrappedVerifier)) public transactVerifiers;
  mapping(uint32 => WrappedVerifier) public rollupVerifiers;

  // For checking duplicates.
  mapping(uint256 => bool) public historicCommitments;
  mapping(uint256 => bool) public relayCommitments;
  mapping(uint256 => bool) public spentSerialNumbers;

  // Source Deposit transaction counter
  uint256 public sourceCommitmentCount = 0;

  // Commitment queue related.
  mapping(uint256 => CommitmentLeaf) public commitmentQueue;
  uint256 public commitmentQueueSize = 0;
  uint256 public commitmentIncludedCount = 0;

  // Deposit merkle tree roots;
  uint256 public immutable treeCapacity;
  mapping(uint32 => uint256) public rootHistory;
  uint256 public currentRoot;
  uint32 public currentRootIndex = 0;
  uint32 public rootHistoryLength;

  // Admin related.
  address public operator;
  uint256 public minBridgeFee;
  uint256 public minExecutorFee;
  uint256 public minRollupFee;
  mapping(address => bool) public rollupWhitelist;

  // Some switches.
  bool public isDepositsDisabled;
  bool public isVerifierUpdateDisabled;
  bool public isRollupWhitelistDisabled;

  //bridge proxy and peer contract meta
  address public relayProxyAddress;
  uint64 public peerChainId;
  address public peerContractAddress;

  modifier onlyOperator() {
    require(msg.sender == operator, "Only operator can call this function.");
    _;
  }

  modifier onlyRelayProxyContract() {
    require(msg.sender == relayProxyAddress, "msg sender is not relay proxy");
    _;
  }

  modifier onlyWhitelisted() {
    require(
      isRollupWhitelistDisabled || rollupWhitelist[msg.sender],
      "Only whitelisted can call this function."
    );
    _;
  }

  event EncryptedNote(uint256 indexed commitment, bytes encryptedNote);
  event CommitmentQueued(uint256 indexed commitment, uint256 rollupFee, uint256 leafIndex);
  event CommitmentIncluded(uint256 indexed commitment);
  event CommitmentSpent(uint256 indexed rootHash, uint256 indexed serialNumber);

  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minBridgeFee,
    uint256 _minExecutorFee,
    uint256 _minRollupFee,
    address _hasher3
  ) {
    require(_rootHistoryLength > 0, "_rootHistoryLength should be greater than 0");
    require(_minExecutorFee > 0, "_minExecutorFee should be greater than 0");
    require(_minRollupFee > 0, "_minRollupFee should be greater than 0");
    hasher3 = IHasher3(_hasher3);
    operator = msg.sender;
    rootHistoryLength = _rootHistoryLength;
    minBridgeFee = _minBridgeFee;
    minExecutorFee = _minExecutorFee;
    minRollupFee = _minRollupFee;
    treeCapacity = 2**uint256(_treeHeight);
    currentRoot = _zeros(_treeHeight);
    rootHistory[currentRootIndex] = currentRoot;
    relayProxyAddress = _relayProxyAddress;
    peerChainId = _peerChainId;
    peerContractAddress = address(0);
  }

  function deposit(DepositRequest memory request) external payable override {
    require(!isDepositsDisabled, "deposits are disabled");
    require(request.bridgeFee >= minBridgeFee, "bridge fee too few");
    require(request.executorFee >= minExecutorFee, "executor fee too few");
    require(request.rollupFee >= minRollupFee, "rollup fee too few");
    require(sourceCommitmentCount < treeCapacity, "tree is full");
    require(!historicCommitments[request.commitment], "the commitment has been submitted");
    uint256 calculatedCommitment = _commitmentHash(request.hashK, request.amount, request.randomS);
    require(request.commitment == calculatedCommitment, "commitment hash incorrect");
    historicCommitments[request.commitment] = true;
    sourceCommitmentCount++;
    _processDepositTransfer(request.amount + request.executorFee + request.rollupFee, request.bridgeFee);
    _processDeposit(
      request.amount,
      request.commitment,
      request.bridgeFee,
      request.executorFee,
      request.rollupFee
    );
    emit EncryptedNote(request.commitment, request.encryptedNote);
  }

  function _processDeposit(
    uint256 amount,
    uint256 commitment,
    uint256 bridgeFee,
    uint256 executeFee,
    uint256 rollupFee
  ) internal virtual;

  function _syncDeposit(
    uint64 fromChainId,
    address fromContractAddr,
    bytes memory txDataBytes
  ) internal {
    require(fromContractAddr == peerContractAddress, "from proxy address not matched");
    require(fromChainId == peerChainId, "from chain id not matched");
    CrossChainData memory txData = deserializeTxData(txDataBytes);
    require(txData.amount > 0, "amount should be greater than 0");
    require(txData.executorFee >= minExecutorFee, "executor fee too few");
    require(txData.rollupFee >= minRollupFee, "rollup fee too few");
    require(commitmentIncludedCount + commitmentQueueSize < treeCapacity, "tree is full");
    require(!relayCommitments[txData.commitment], "The commitment has been submitted");
    relayCommitments[txData.commitment] = true;

    _enqueueCommitment(txData.commitment, txData.rollupFee, txData.executorFee);
  }

  function rollup(RollupRequest memory request) external override onlyWhitelisted {
    require(!isKnownRoot(request.newRoot), "newRoot is duplicated");
    require(
      request.rollupSize > 0 &&
        request.rollupSize <= commitmentQueueSize &&
        rollupVerifiers[request.rollupSize].enabled,
      "invalid rollupSize"
    );
    require(commitmentIncludedCount % request.rollupSize == 0, "invalid rollupSize at current state");
    uint256 pathIndices = _pathIndices(commitmentIncludedCount, request.rollupSize);
    uint256[] memory leaves = new uint256[](request.rollupSize);
    uint256 totalRollupFee = 0;
    for (
      uint256 index = commitmentIncludedCount;
      index < commitmentIncludedCount + request.rollupSize;
      index++
    ) {
      require(commitmentQueue[index].commitment != 0, "index out of bound");
      uint256 commitment = commitmentQueue[index].commitment;
      leaves[index - commitmentIncludedCount] = commitment;
      totalRollupFee = totalRollupFee + commitmentQueue[index].rollupFee;
      delete commitmentQueue[index];
      commitmentQueueSize = commitmentQueueSize - 1;
      emit CommitmentIncluded(commitment);
    }
    uint256 expectedLeafHash = uint256(keccak256(abi.encodePacked(leaves))) % FIELD_SIZE;
    require(request.leafHash == expectedLeafHash, "invalid leafHash");
    uint256[] memory inputs = new uint256[](4);
    inputs[0] = currentRoot;
    inputs[1] = request.newRoot;
    inputs[2] = request.leafHash;
    inputs[3] = pathIndices;
    bool verified = rollupVerifiers[request.rollupSize].verifier.verifyTx(request.proof, inputs);
    require(verified, "invalid proof");
    _processRollupFeeTransfer(totalRollupFee);
    commitmentIncludedCount = commitmentIncludedCount + request.rollupSize;
    currentRoot = request.newRoot;
    currentRootIndex = (currentRootIndex + 1) % rootHistoryLength;
    rootHistory[currentRootIndex] = request.newRoot;
  }

  function transact(TransactRequest memory request, bytes memory signature)
    external
    payable
    override
    nonReentrant
  {
    uint32 numInputs = uint32(request.serialNumbers.length);
    uint32 numOutputs = uint32(request.outCommitments.length);

    // check input and output lengths.
    require(transactVerifiers[numInputs][numOutputs].enabled, "invalid i/o length");
    require(request.sigHashes.length == numInputs, "invalid sigHashes length");
    require(request.outRollupFees.length == numOutputs, "invalid outRollupFees length");
    require(request.outEncryptedNotes.length == numOutputs, "invalid outEncryptedNotes length");
    require(commitmentIncludedCount + commitmentQueueSize + numOutputs <= treeCapacity, "tree is full");

    // check signature
    bytes32 hash = _transactRequestHash(request);
    address recoveredSigPk = ECDSA.recover(hash, signature);
    require(request.sigPk == bytes32(uint256(uint160(recoveredSigPk))), "invalid signature");

    // initialize inputs array for verifying proof.
    uint256[] memory inputs = new uint256[](4 + 2 * numInputs + 2 * numOutputs);

    // check whether valid root.
    require(isKnownRoot(request.rootHash), "invalid root");
    inputs[0] = request.rootHash;

    // check serial numbers.
    for (uint32 i = 0; i < numInputs; i++) {
      require(!spentSerialNumbers[request.serialNumbers[i]], "the note has been spent");
      inputs[i + 1] = request.serialNumbers[i];
      inputs[i + 1 + numInputs] = request.sigHashes[i];
    }
    inputs[2 * numInputs + 1] = uint256(request.sigPk);
    inputs[2 * numInputs + 2] = uint256(request.publicAmount);
    inputs[2 * numInputs + 3] = uint256(request.relayerFeeAmount);

    // check rollup fees and output commitments.
    for (uint32 i = 0; i < numOutputs; i++) {
      require(!relayCommitments[request.outCommitments[i]], "duplicate commitment");
      require(request.outRollupFees[i] >= minRollupFee, "rollup fee too low");
      inputs[2 * numInputs + 4 + i] = request.outCommitments[i];
      inputs[2 * numInputs + numOutputs + 4 + i] = request.outRollupFees[i];
    }

    // verify proof.
    bool verified = transactVerifiers[numInputs][numOutputs].verifier.verifyTx(request.proof, inputs);
    require(verified, "invalid transact proof");

    // set spent flag for serial numbers.
    for (uint32 i = 0; i < numInputs; i++) {
      spentSerialNumbers[request.serialNumbers[i]] = true;
      emit CommitmentSpent(request.rootHash, request.serialNumbers[i]);
    }

    // enqueue output commitments.
    for (uint32 i = 0; i < numOutputs; i++) {
      relayCommitments[request.outCommitments[i]] = true;
      _enqueueCommitment(request.outCommitments[i], request.outRollupFees[i], 0);
      emit EncryptedNote(request.outCommitments[i], request.outEncryptedNotes[i]);
    }

    // withdraw tokens to public recipient.
    if (request.publicAmount > 0) {
      _processWithdrawTransfer(request.publicRecipient, request.publicAmount);
    }

    // withdraw tokens to relayer.
    if (request.relayerFeeAmount > 0) {
      _processWithdrawTransfer(request.relayerAddress, request.relayerFeeAmount);
    }
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

  function toggleRollupWhitelist(bool _state) external onlyOperator {
    isRollupWhitelistDisabled = _state;
  }

  function toggleVerifierUpdate(bool _state) external onlyOperator {
    isVerifierUpdateDisabled = _state;
  }

  function enableTransactVerifier(
    uint32 numInputs,
    uint32 numOutputs,
    address _transactVerifier
  ) external onlyOperator {
    require(!isVerifierUpdateDisabled, "Verifier updates have been disabled.");
    require(numInputs > 0, "numInputs should > 0");
    require(numOutputs >= 0, "numOutputs should >= 0");
    transactVerifiers[numInputs][numOutputs] = WrappedVerifier(IVerifier(_transactVerifier), true);
  }

  function disableTransactVerifier(uint32 numInputs, uint32 numOutputs) external onlyOperator {
    require(!isVerifierUpdateDisabled, "Verifier updates have been disabled.");
    require(numInputs > 0, "numInputs should > 0");
    require(numOutputs >= 0, "numOutputs should >= 0");
    if (transactVerifiers[numInputs][numOutputs].enabled) {
      transactVerifiers[numInputs][numOutputs].enabled = false;
    }
  }

  function enableRollupVerifier(uint32 rollupSize, address _rollupVerifier) external onlyOperator {
    require(!isVerifierUpdateDisabled, "Verifier updates have been disabled.");
    require(rollupSize > 0, "invalid rollupSize");
    rollupVerifiers[rollupSize] = WrappedVerifier(IVerifier(_rollupVerifier), true);
  }

  function disableRollupVerifier(uint32 rollupSize) external onlyOperator {
    require(rollupSize > 0, "invalid rollupSize");
    require(!isVerifierUpdateDisabled, "Verifier updates have been disabled.");
    if (rollupVerifiers[rollupSize].enabled) {
      rollupVerifiers[rollupSize].enabled = false;
    }
  }

  function addRollupWhitelist(address roller) external onlyOperator {
    rollupWhitelist[roller] = true;
  }

  function removeRollupWhitelist(address roller) external onlyOperator {
    rollupWhitelist[roller] = false;
  }

  function setMinBridgeFee(uint256 _minBridgeFee) external onlyOperator {
    minBridgeFee = _minBridgeFee;
  }

  function setMinExecutorFee(uint256 _minExecutorFee) external onlyOperator {
    require(_minExecutorFee > 0, "invalid _minMinExecutorFee");
    minExecutorFee = _minExecutorFee;
  }

  function setMinRollupFee(uint256 _minRollupFee) external onlyOperator {
    require(_minRollupFee > 0, "invalid _minRollupFee");
    minRollupFee = _minRollupFee;
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

  function bridgeType() public pure virtual returns (string memory);

  function _commitmentHash(
    uint256 hashK,
    uint256 amount,
    uint128 randomS
  ) internal view returns (uint256) {
    require(hashK < FIELD_SIZE, "hashK should be less than FIELD_SIZE");
    require(amount < FIELD_SIZE, "randomS should be less than FIELD_SIZE");
    return hasher3.poseidon([hashK, amount, uint256(randomS)]);
  }

  function _enqueueCommitment(
    uint256 commitment,
    uint256 rollupFee,
    uint256 executorFee
  ) internal {
    commitmentQueue[commitmentQueueSize] = CommitmentLeaf(commitment, rollupFee);
    uint256 leafIndex = commitmentQueueSize + commitmentIncludedCount;
    commitmentQueueSize = commitmentQueueSize + 1;
    if (executorFee > 0) {
      _processExecutorFeeTransfer(executorFee);
    }
    emit CommitmentQueued(commitment, rollupFee, leafIndex);
  }

  function _zeros(uint32 nth) internal pure returns (uint256) {
    if (nth == 0) {
      return 4506069241680023110764189603658664710592327039412547147745745078424755206435;
    } else if (nth == 1) {
      return 11970986605677607431310473423176184560047228481560615908426980545799110088554;
    } else if (nth == 2) {
      return 7738458864445542950035640909064911813760082193622764438647303881621331058401;
    } else if (nth == 3) {
      return 1824110265544309188449535094624170286636245442276303308874119852616011569117;
    } else if (nth == 4) {
      return 439876057652168043934546800930066844791837722960866592010071331117924956099;
    } else if (nth == 5) {
      return 12148869658182608721880798177538135429676415436078660143891999467741175137753;
    } else if (nth == 6) {
      return 19053554365366326893907951819376775362002701838241631566910091576437078877172;
    } else if (nth == 7) {
      return 10852150351752357373309416331902947839408978407172036283446975657659303929195;
    } else if (nth == 8) {
      return 6566746118285923398615130593102917883145176519985675587853568572822039375467;
    } else if (nth == 9) {
      return 11417224681467267073071367078086518555025552633367123694305661076901745684286;
    } else if (nth == 10) {
      return 13146739646829761771013347284695047890376017649809716402068931193605641442310;
    } else if (nth == 11) {
      return 13459844126372070230208178859743367134654673422311448382103194318897111588993;
    } else if (nth == 12) {
      return 14583232149490424807206413850907122884313879413776985151786010057621431694070;
    } else if (nth == 13) {
      return 2518967593166921945692229141011622021498534525148812865797548053589389731063;
    } else if (nth == 14) {
      return 19430810468586029191888627527380085964985035379281934526683112683473563049974;
    } else if (nth == 15) {
      return 1897867614655011189086460938574526976583854364278605894377849343324624277074;
    } else if (nth == 16) {
      return 18754984716384146963617729123402842399317045829379373763323387175769990714598;
    } else if (nth == 17) {
      return 405949121641363157950726008207114912594987007836580877922134622675538021820;
    } else if (nth == 18) {
      return 1088017070740705619214203129319291293539718028549242800354988860810207454418;
    } else if (nth == 19) {
      return 21353011710845911836996543245897491023336659221412024163427506108383429011430;
    } else if (nth == 20) {
      return 17749238747541177922260023106539184144732198174810064796938596694265936155259;
    } else if (nth == 21) {
      return 2075393378094693254774654573545142692544561637317244351058483052393751634703;
    } else if (nth == 22) {
      return 16722505204088094412486203391222218829920348347221074175055753816911628645782;
    } else if (nth == 23) {
      return 12363952950807080168581550733914407510536975151639310957950584477670860711847;
    } else if (nth == 24) {
      return 10329604628575281453151767624989354700984823669533380647141683321011842904387;
    } else if (nth == 25) {
      return 6786932317737336481836453155794576859076099363706263920807867623375002220051;
    } else if (nth == 26) {
      return 1095762658628848651950133756531023934995326201606239762241842229511708432973;
    } else if (nth == 27) {
      return 15972138919465776163920491001484366021008021716324328852925101476359351519255;
    } else if (nth == 28) {
      return 16129330525015604662646302893604911744769665677133181295582480658744807402110;
    } else if (nth == 29) {
      return 16704502504460675449846784815849025989402638612907582712659689210169156075769;
    } else if (nth == 30) {
      return 13519934288458064102175830458858015936170401683429767173542225128161091455592;
    } else if (nth == 31) {
      return 13202030544264649816737469308990869537826379298057211734249690002947353708909;
    } else if (nth == 32) {
      return 17318897336142888270342651912033539049925356757640177789706671990424346301218;
    }
    return 0;
  }

  function _pathIndices(uint256 fullPath, uint32 rollupSize) internal pure returns (uint256) {
    rollupSize >>= 1;
    while (rollupSize != 0) {
      fullPath >>= 1;
      rollupSize >>= 1;
    }
    return fullPath;
  }

  function _transactRequestHash(TransactRequest memory request) internal pure returns (bytes32) {
    bytes memory requestBytes = abi.encodePacked(request.publicRecipient, request.relayerAddress);
    for (uint32 i = 0; i < request.outEncryptedNotes.length; i++) {
      requestBytes = abi.encodePacked(requestBytes, request.outEncryptedNotes[i]);
    }
    return ECDSA.toEthSignedMessageHash(keccak256(requestBytes));
  }
}
