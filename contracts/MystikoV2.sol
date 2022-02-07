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
    uint256[3] memory input
  ) external returns (bool);
}

struct DepositLeaf {
  uint256 commitment;
  uint256 rollupFee;
}

struct RollupVerifier {
  IRollupVerifier verifier;
  bool enabled;
}

abstract contract MystikoV2 is AssetPool, ReentrancyGuard {
  uint256 public constant FIELD_SIZE =
    21888242871839275222246405745257275088548364400416034343698204186575808495617;

  // Verifier related.
  IWithdrawVerifier public withdrawVerifier;
  mapping(uint32 => RollupVerifier) public rollupVerifiers;

  // For checking duplicates.
  mapping(uint256 => bool) public depositedCommitments;
  mapping(uint256 => bool) public spentSerialNumbers;

  // Deposit queue related.
  mapping(uint256 => DepositLeaf) public depositQueue;
  uint256 public depositQueueSize = 0;
  uint256 public depositQueueIndex = 0;

  // Deposit merkle tree roots;
  uint256 public treeCapacity;
  mapping(uint32 => uint256) public rootHistory;
  uint256 public currentRoot;
  uint32 public currentRootIndex = 0;
  uint32 public rootHistoryLength;

  // Admin related.
  address public operator;
  uint256 public minRollupFee;
  mapping(address => bool) public rollupWhitelist;

  // Some switches.
  bool public isDepositsDisabled;
  bool public isVerifierUpdateDisabled;
  bool public isRollupWhitelisted;

  modifier onlyOperator() {
    require(msg.sender == operator, "Only operator can call this function.");
    _;
  }

  modifier onlyWhitelisted() {
    require(!isRollupWhitelisted || rollupWhitelist[msg.sender], "Only whitelisted can call this function.");
    _;
  }

  event EncryptedNote(uint256 indexed commitment, bytes encryptedNote);
  event DepositQueued(uint256 indexed commitment, uint256 amount, uint256 rollupFee, uint256 leafIndex);
  event DepositIncluded(uint256 indexed commitment);
  event Withdraw(address recipient, uint256 indexed rootHash, uint256 indexed serialNumber);

  constructor(
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minRollupFee,
    address _withdrawVerifier
  ) public {
    require(_rootHistoryLength > 0, "_rootHistoryLength should be greater than 0");
    require(_minRollupFee > 0, "_minRollupFee should be greater than 0");
    withdrawVerifier = IWithdrawVerifier(_withdrawVerifier);
    operator = msg.sender;
    rootHistoryLength = _rootHistoryLength;
    minRollupFee = _minRollupFee;
    treeCapacity = 2 ** uint256(_treeHeight);
    currentRoot = _zeros(_treeHeight);
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
    require(currentRootIndex + 1 <= treeCapacity, 'tree is full');
    require(!depositedCommitments[commitment], "the commitment has been submitted");
    uint256 calculatedCommitment = _commitmentHash(hashK, amount, randomS);
    require(commitment == calculatedCommitment, "commitment hash incorrect");
    require(rollupFee >= minRollupFee, "rollup fee too few");
    depositedCommitments[commitment] = true;
    _processDepositTransfer(amount + rollupFee);
    _processDeposit(amount, commitment, rollupFee);
    emit EncryptedNote(commitment, encryptedNote);
  }

  function rollup(
    uint256[2] memory proofA,
    uint256[2][2] memory proofB,
    uint256[2] memory proofC,
    uint32 rollupSize,
    uint256 newRoot,
    uint256 leafHash
  ) public onlyWhitelisted {
    require(!isKnownRoot(newRoot), "newRoot is duplicated");
    require(rollupSize <= depositQueueSize, "rollupSize too big");
    require(rollupVerifiers[rollupSize].enabled, "invalid rollupSize");
    require(depositQueueIndex % rollupSize == 0, "invalid rollupSize at this index");
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
      emit DepositIncluded(commitment);
    }
    uint256 expectedLeafHash = uint256(sha256(leavesData)) % FIELD_SIZE;
    require(leafHash == expectedLeafHash, "invalid leafHash");
    bool verified = rollupVerifiers[rollupSize].verifier.verifyProof(
      proofA,
      proofB,
      proofC,
      [currentRoot, newRoot, leafHash]
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

  function toggleRollupWhitelist(bool _state) external onlyOperator {
    isRollupWhitelisted = _state;
  }

  function addRollupWhiteList(address roller) external onlyOperator {
    rollupWhitelist[roller] = true;
  }

  function disableVerifierUpdate() external onlyOperator {
    isVerifierUpdateDisabled = true;
  }

  function setWithdrawVerifier(address _withdrawVerifier) external onlyOperator {
    require(!isVerifierUpdateDisabled, "Verifier updates have been disabled.");
    withdrawVerifier = IWithdrawVerifier(_withdrawVerifier);
  }

  function enableRollupVerifier(uint32 rollupSize, address _rollupVerifier) external onlyOperator {
    rollupVerifiers[rollupSize] = RollupVerifier(IRollupVerifier(_rollupVerifier), true);
  }

  function disableRollupVerifier(uint32 rollupSize) external onlyOperator {
    if (rollupVerifiers[rollupSize].enabled) {
      rollupVerifiers[rollupSize].enabled = false;
    }
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
    depositQueue[depositQueueSize] = DepositLeaf(commitment, rollupFee);
    uint256 leafIndex = depositQueueSize + depositQueueIndex;
    depositQueueSize = depositQueueSize + 1;
    emit DepositQueued(commitment, amount, rollupFee, leafIndex);
  }

  function _processDeposit(
    uint256 amount,
    uint256 commitment,
    uint256 rollupFee
  ) internal virtual;

  function bridgeType() public view virtual returns (string memory);

  function _zeros(uint32 nth) pure internal returns(uint256) {
    if (nth == 0) { return 4506069241680023110764189603658664710592327039412547147745745078424755206435; }
    else if (nth == 1) { return 11970986605677607431310473423176184560047228481560615908426980545799110088554; }
    else if (nth == 2) { return 7738458864445542950035640909064911813760082193622764438647303881621331058401; }
    else if (nth == 3) { return 1824110265544309188449535094624170286636245442276303308874119852616011569117; }
    else if (nth == 4) { return 439876057652168043934546800930066844791837722960866592010071331117924956099; }
    else if (nth == 5) { return 12148869658182608721880798177538135429676415436078660143891999467741175137753; }
    else if (nth == 6) { return 19053554365366326893907951819376775362002701838241631566910091576437078877172; }
    else if (nth == 7) { return 10852150351752357373309416331902947839408978407172036283446975657659303929195; }
    else if (nth == 8) { return 6566746118285923398615130593102917883145176519985675587853568572822039375467; }
    else if (nth == 9) { return 11417224681467267073071367078086518555025552633367123694305661076901745684286; }
    else if (nth == 10) { return 13146739646829761771013347284695047890376017649809716402068931193605641442310; }
    else if (nth == 11) { return 13459844126372070230208178859743367134654673422311448382103194318897111588993; }
    else if (nth == 12) { return 14583232149490424807206413850907122884313879413776985151786010057621431694070; }
    else if (nth == 13) { return 2518967593166921945692229141011622021498534525148812865797548053589389731063; }
    else if (nth == 14) { return 19430810468586029191888627527380085964985035379281934526683112683473563049974; }
    else if (nth == 15) { return 1897867614655011189086460938574526976583854364278605894377849343324624277074; }
    else if (nth == 16) { return 18754984716384146963617729123402842399317045829379373763323387175769990714598; }
    else if (nth == 17) { return 405949121641363157950726008207114912594987007836580877922134622675538021820; }
    else if (nth == 18) { return 1088017070740705619214203129319291293539718028549242800354988860810207454418; }
    else if (nth == 19) { return 21353011710845911836996543245897491023336659221412024163427506108383429011430; }
    else if (nth == 20) { return 17749238747541177922260023106539184144732198174810064796938596694265936155259; }
    else if (nth == 21) { return 2075393378094693254774654573545142692544561637317244351058483052393751634703; }
    else if (nth == 22) { return 16722505204088094412486203391222218829920348347221074175055753816911628645782; }
    else if (nth == 23) { return 12363952950807080168581550733914407510536975151639310957950584477670860711847; }
    else if (nth == 24) { return 10329604628575281453151767624989354700984823669533380647141683321011842904387; }
    else if (nth == 25) { return 6786932317737336481836453155794576859076099363706263920807867623375002220051; }
    else if (nth == 26) { return 1095762658628848651950133756531023934995326201606239762241842229511708432973; }
    else if (nth == 27) { return 15972138919465776163920491001484366021008021716324328852925101476359351519255; }
    else if (nth == 28) { return 16129330525015604662646302893604911744769665677133181295582480658744807402110; }
    else if (nth == 29) { return 16704502504460675449846784815849025989402638612907582712659689210169156075769; }
    else if (nth == 30) { return 13519934288458064102175830458858015936170401683429767173542225128161091455592; }
    else if (nth == 31) { return 13202030544264649816737469308990869537826379298057211734249690002947353708909; }
    else if (nth == 32) { return 17318897336142888270342651912033539049925356757640177789706671990424346301218; }
    return 0;
  }
}
