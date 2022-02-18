// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

interface IHasher {
  function poseidon(bytes32[2] memory input) external pure returns (bytes32 output);
}

contract MerkleTreeWithHistory {
  uint256 public constant FIELD_SIZE =
    21888242871839275222246405745257275088548364400416034343698204186575808495617;
  IHasher public immutable hasher;

  uint32 public levels;

  // the following variables are made public for easier testing and debugging and
  // are not supposed to be accessed in regular code

  // filledSubtrees and roots could be bytes32[size], but using mappings makes it cheaper because
  // it removes index range check on every interaction
  mapping(uint256 => bytes32) public filledSubtrees;
  mapping(uint256 => bytes32) public roots;
  uint32 public constant ROOT_HISTORY_SIZE = 30;
  uint32 public currentRootIndex = 0;
  uint32 public nextIndex = 0;

  constructor(uint32 _levels, address _hasher) public {
    require(_levels > 0, "_levels should be greater than zero");
    require(_levels < 32, "_levels should be less than 32");
    levels = _levels;
    hasher = IHasher(_hasher);

    for (uint32 i = 0; i < _levels; i++) {
      filledSubtrees[i] = zeros(i);
    }

    roots[0] = zeros(_levels - 1);
  }

  /**
    @dev Hash 2 tree leaves, returns Poseidon([_left, _right])
  */
  function hashLeftRight(
    IHasher _hasher,
    bytes32 _left,
    bytes32 _right
  ) public pure returns (bytes32) {
    require(uint256(_left) < FIELD_SIZE, "_left should be inside the field");
    require(uint256(_right) < FIELD_SIZE, "_right should be inside the field");
    bytes32 hash = _hasher.poseidon([_left, _right]);
    require(uint256(hash) < FIELD_SIZE, "hash should be inside the field");
    return hash;
  }

  function getLevels() public view returns (uint32) {
    return levels;
  }

  function _insert(bytes32 _leaf) internal returns (uint32 index) {
    uint32 _nextIndex = nextIndex;
    require(_nextIndex != uint32(2)**levels, "Merkle tree is full. No more leaves can be added");
    uint32 currentIndex = _nextIndex;
    bytes32 currentLevelHash = _leaf;
    bytes32 left;
    bytes32 right;

    for (uint32 i = 0; i < levels; i++) {
      if (currentIndex % 2 == 0) {
        left = currentLevelHash;
        right = zeros(i);
        filledSubtrees[i] = currentLevelHash;
      } else {
        left = filledSubtrees[i];
        right = currentLevelHash;
      }
      currentLevelHash = hashLeftRight(hasher, left, right);
      currentIndex /= 2;
    }

    uint32 newRootIndex = (currentRootIndex + 1) % ROOT_HISTORY_SIZE;
    currentRootIndex = newRootIndex;
    roots[newRootIndex] = currentLevelHash;
    nextIndex = _nextIndex + 1;
    return _nextIndex;
  }

  /**
    @dev Whether the root is present in the root history
  */
  function isKnownRoot(bytes32 _root) public view returns (bool) {
    if (_root == 0) {
      return false;
    }
    uint32 _currentRootIndex = currentRootIndex;
    uint32 i = _currentRootIndex;
    do {
      if (_root == roots[i]) {
        return true;
      }
      if (i == 0) {
        i = ROOT_HISTORY_SIZE;
      }
      i--;
    } while (i != _currentRootIndex);
    return false;
  }

  /**
    @dev Returns the last root
  */
  function getLastRoot() public view returns (bytes32) {
    return roots[currentRootIndex];
  }

  /// @dev provides Zero (Empty) elements for a Poseidon MerkleTree. Up to 32 levels
  function zeros(uint256 i) public pure returns (bytes32) {
    if (i == 0) return bytes32(0x09f658457775074ff4c842032a5ec2f1134c32784cca59d594caac8c503b7923);
    else if (i == 1) return bytes32(0x1a77569b79cb7c2eaf9368de9e3b1efc0a606561e5ab299c2337340f3cdd576a);
    else if (i == 2) return bytes32(0x111bd0002b1e3b8f1978c932b5ccb2fab87fdb0acab2ddb266f9a346dcb11ee1);
    else if (i == 3) return bytes32(0x040868ea2a363e05d7ae44280f69b49e429ab096ca2844efe91f8d6b3dad57dd);
    else if (i == 4) return bytes32(0x00f8f605c92c8502c8fe83be1b83b24e3f67312a388f30cbadb5dee8974137c3);
    else if (i == 5) return bytes32(0x1adc043c99adbc0c86a60a36db0f661e2dd96f36ede322f954386d8935a0c5d9);
    else if (i == 6) return bytes32(0x2a1fedfa71da723ac3e9b35cef752fa1b647b2b737a23e91241cb7bdc419e3f4);
    else if (i == 7) return bytes32(0x17fe1974543c4c4b228e1292f7e3200d31435fc910ee5a8c5cafd329cc4b256b);
    else if (i == 8) return bytes32(0x0e84a586eb63a0eec0f1fe5785022441f0e29e4ae859c7ce1f5fc88a42ad2e6b);
    else if (i == 9) return bytes32(0x193deb901f6eeb032e02e093280db17e373d4ff52bafda9215b46bb9b0a86f3e);
    else if (i == 10) return bytes32(0x1d10ca7b985697cb519565a5006c3f44b020b2edab9b7422ed15dc34532f9406);
    else if (i == 11) return bytes32(0x1dc200763555467a4e583e00badfdc1fb4d3d3f8f1cc81f31fd2f8b387776081);
    else if (i == 12) return bytes32(0x203dd11fdba0ed13b20ca2d6952f3feb7461836a03512e0cccce8467b320b2f6);
    else if (i == 13) return bytes32(0x0591af64e64a3e69caf23eee2bdea90885343a49f547ee9464e95d8d6267e4f7);
    else if (i == 14) return bytes32(0x2af572f1077a32f46dc8e307d43c0fa6753b400b2107325976b8df7380545ff6);
    else if (i == 15) return bytes32(0x043227ae4b70b1aacd04e35e6aaed7b56d91220c31e97aaf52e12a6a56984e52);
    else if (i == 16) return bytes32(0x2976f1f6a91d83d4c528dad69ece6d3d91934b0e5657e915b360c8c4c2fb54e6);
    else if (i == 17) return bytes32(0x00e5c251c9e093658be0cd1b0df55b6f70f3d09146c1c8b4212a4ddcde700dbc);
    else if (i == 18) return bytes32(0x0267cbbc1bc2f1c3e3073d2ee60df8cc0bfef39fe3cee735c9ad5c8ad30064d2);
    else if (i == 19) return bytes32(0x2f356057bc56f67dbf159a0e8935022acd5e982dce9f4071adc43e4d57ce27e6);
    else if (i == 20) return bytes32(0x273db68f52f12a9d8022ae524050064e42d4d1661c9bcce958acf89b5e8b127b);
    else if (i == 21) return bytes32(0x0496a18ad4cca81b7c98ceb197439ad925e0f7f62d69dfa42cf9574be77fe30f);
    else if (i == 22) return bytes32(0x24f89a3f943d421b2f3a554b65459f42b820ac09d6fd9d693df5f8ba732ab596);
    else if (i == 23) return bytes32(0x1b55bfd751c6807df36876cdce68034ab43210be2bc8afa8043c7f428604e7a7);
    else if (i == 24) return bytes32(0x16d6595a398cf20f2489b90e958166f1e19c537c0c46e9b8ea5462391ee8f143);
    else if (i == 25) return bytes32(0x0f01447ef8f621592474b678ed2fc404ebaf22a6fce15364bb4152a88c113613);
    else if (i == 26) return bytes32(0x026c2dffee48bacbc9d21cf90aa7c6e525ab01db6966a9e7e53b3d3f4d1f5a4d);
    else if (i == 27) return bytes32(0x234fe90732795745b2c504c791242a2bb193baa1cbeab57db9324b6bb9134817);
    else if (i == 28) return bytes32(0x23a8e0a7e60981c52ebb498c260d5bef4d7c65145d17128996a77c33a3262a7e);
    else if (i == 29) return bytes32(0x24ee69d2565210c7027ff6fc2657ed029278bc79f41077fe3281ea5d5d8e80f9);
    else if (i == 30) return bytes32(0x1de402fa32463bb2917b733aeef0197a49cacacd1fe860c3acc8cd3b65a30a68);
    else if (i == 31) return bytes32(0x1d3015a0f6a7b3f754171d0540628107e50e25debceb16e0e33ae4205501896d);
    else revert("Index out of bounds");
  }
}
