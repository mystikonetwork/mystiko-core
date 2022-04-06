pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/sha256/sha256.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "MerkleTree.circom";
include "MerkleTreeUpdater.circom";

template MerkleTreeLeafHasher(numOfLeaves) {
  signal input leaves[numOfLeaves];
  signal output hash;

  component hasher = Sha256(256 * numOfLeaves);
  component leavesBits[numOfLeaves];
  var index = 0;
  for (var i = 0; i < numOfLeaves; i++) {
    leavesBits[i] = Num2Bits(256);
    leavesBits[i].in <== leaves[i];
    for (var j = 0; j < 256; j++) {
      hasher.in[index + j] <== leavesBits[i].out[255 - j];
    }
    index = index + 256;
  }
  component hashNum = Bits2Num(256);
  for (var i = 0; i < 256; i++) {
    hashNum.in[i] <== hasher.out[255 - i];
  }
  hash <== hashNum.out;
}

template MerkleTreeLayer(height) {
  var numOfNodes = 1 << height;
  signal input children[2 * numOfNodes];
  signal output parents[numOfNodes];

  component hasher[numOfNodes];
  for (var i = 0; i < numOfNodes; i++) {
    hasher[i] = HashLeftRight();
    hasher[i].left <== children[2 * i];
    hasher[i].right <== children[2 * i + 1];
    parents[i] <== hasher[i].hash;
  }
}

template MerkleTreeBatchUpdater(levels, batchLevels, batchZeroLeaf) {
  var batchHeight = levels - batchLevels;
  var numOfLeaves = 1 << batchLevels;
  signal input oldRoot;
  signal input newRoot;
  signal input pathIndices;
  signal input leafHash;
  signal input leaves[numOfLeaves];
  signal input pathElements[batchHeight];

  component leavesHasher = MerkleTreeLeafHasher(numOfLeaves);
  for (var i = 0; i < numOfLeaves; i++) {
    leavesHasher.leaves[i] <== leaves[i];
  }
  leafHash === leavesHasher.hash;

  component treeUpdater = MerkleTreeUpdater(batchHeight, batchZeroLeaf);
  component treeLayers[batchLevels];

  if (batchLevels > 0) {
    for (var level = batchLevels - 1; level >= 0; level--) {
      treeLayers[level] = MerkleTreeLayer(level);
      for (var i = 0; i < (1 << (level + 1)); i++) {
        treeLayers[level].children[i] <== level == batchLevels - 1 ? leaves[i] : treeLayers[level + 1].parents[i];
      }
    }
    treeUpdater.newLeaf <== treeLayers[0].parents[0];
  } else {
    treeUpdater.newLeaf <== leaves[0];
  }

  treeUpdater.oldRoot <== oldRoot;
  treeUpdater.newRoot <== newRoot;
  treeUpdater.pathIndices <== pathIndices;
  for (var i = 0; i < batchHeight; i++) {
    treeUpdater.pathElements[i] <== pathElements[i];
  }
}

function nthZeroElement(n) {
  if (n == 0) { return 4506069241680023110764189603658664710592327039412547147745745078424755206435; }
  if (n == 1) { return 11970986605677607431310473423176184560047228481560615908426980545799110088554; }
  if (n == 2) { return 7738458864445542950035640909064911813760082193622764438647303881621331058401; }
  if (n == 3) { return 1824110265544309188449535094624170286636245442276303308874119852616011569117; }
  if (n == 4) { return 439876057652168043934546800930066844791837722960866592010071331117924956099; }
  if (n == 5) { return 12148869658182608721880798177538135429676415436078660143891999467741175137753; }
  if (n == 6) { return 19053554365366326893907951819376775362002701838241631566910091576437078877172; }
  if (n == 7) { return 10852150351752357373309416331902947839408978407172036283446975657659303929195; }
  if (n == 8) { return 6566746118285923398615130593102917883145176519985675587853568572822039375467; }
  if (n == 9) { return 11417224681467267073071367078086518555025552633367123694305661076901745684286; }
  if (n == 10) { return 13146739646829761771013347284695047890376017649809716402068931193605641442310; }
  if (n == 11) { return 13459844126372070230208178859743367134654673422311448382103194318897111588993; }
  if (n == 12) { return 14583232149490424807206413850907122884313879413776985151786010057621431694070; }
  if (n == 13) { return 2518967593166921945692229141011622021498534525148812865797548053589389731063; }
  if (n == 14) { return 19430810468586029191888627527380085964985035379281934526683112683473563049974; }
  if (n == 15) { return 1897867614655011189086460938574526976583854364278605894377849343324624277074; }
  if (n == 16) { return 18754984716384146963617729123402842399317045829379373763323387175769990714598; }
  if (n == 17) { return 405949121641363157950726008207114912594987007836580877922134622675538021820; }
  if (n == 18) { return 1088017070740705619214203129319291293539718028549242800354988860810207454418; }
  if (n == 19) { return 21353011710845911836996543245897491023336659221412024163427506108383429011430; }
  if (n == 20) { return 17749238747541177922260023106539184144732198174810064796938596694265936155259; }
  if (n == 21) { return 2075393378094693254774654573545142692544561637317244351058483052393751634703; }
  if (n == 22) { return 16722505204088094412486203391222218829920348347221074175055753816911628645782; }
  if (n == 23) { return 12363952950807080168581550733914407510536975151639310957950584477670860711847; }
  if (n == 24) { return 10329604628575281453151767624989354700984823669533380647141683321011842904387; }
  if (n == 25) { return 6786932317737336481836453155794576859076099363706263920807867623375002220051; }
  if (n == 26) { return 1095762658628848651950133756531023934995326201606239762241842229511708432973; }
  if (n == 27) { return 15972138919465776163920491001484366021008021716324328852925101476359351519255; }
  if (n == 28) { return 16129330525015604662646302893604911744769665677133181295582480658744807402110; }
  if (n == 29) { return 16704502504460675449846784815849025989402638612907582712659689210169156075769; }
  if (n == 30) { return 13519934288458064102175830458858015936170401683429767173542225128161091455592; }
  if (n == 31) { return 13202030544264649816737469308990869537826379298057211734249690002947353708909; }
  return 0;
}
