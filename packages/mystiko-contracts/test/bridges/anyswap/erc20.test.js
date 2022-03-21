import { MerkleTree, v1Protocol } from '@mystikonetwork/protocol';
import { toHex, toBuff, toDecimals, toFixedLenHex, toHexNoPrefix, toBN } from '@mystikonetwork/utils';

const MystikoCoreERC20 = artifacts.require('MystikoWithAnyswapERC20');
const RelayProxy = artifacts.require('AnyswapBillManagerMock');
const Verifier = artifacts.require('WithdrawVerifier');
const Hasher = artifacts.require('Hasher2');
const TestToken = artifacts.require('TestToken');

contract('MystikoWithAnyswapERC20', (accounts) => {
  let mystikoCoreSourceERC20;
  let mystikoCoreDestinationERC20;
  let relayProxy;
  let hasher;
  let verifier;
  let testToken;
  let amount = toBN(toDecimals(1000, 18).toString());

  before(async () => {
    const { MERKLE_TREE_HEIGHT } = process.env;
    const SOURCE_CHAIN_ID = 1100;
    const DESTINATION_CHAIN_ID = 1200;

    testToken = await TestToken.deployed();
    verifier = await Verifier.deployed();
    hasher = await Hasher.deployed();

    relayProxy = await RelayProxy.new();

    mystikoCoreSourceERC20 = await MystikoCoreERC20.new(
      relayProxy.address,
      DESTINATION_CHAIN_ID,
      verifier.address,
      testToken.address,
      hasher.address,
      MERKLE_TREE_HEIGHT,
    );

    mystikoCoreDestinationERC20 = await MystikoCoreERC20.new(
      relayProxy.address,
      SOURCE_CHAIN_ID,
      verifier.address,
      testToken.address,
      hasher.address,
      MERKLE_TREE_HEIGHT,
    );

    await relayProxy.setChainPair(
      SOURCE_CHAIN_ID,
      mystikoCoreSourceERC20.address,
      DESTINATION_CHAIN_ID,
      mystikoCoreDestinationERC20.address,
    );

    await mystikoCoreSourceERC20.setPeerContractAddress(mystikoCoreDestinationERC20.address);
    await mystikoCoreDestinationERC20.setPeerContractAddress(mystikoCoreSourceERC20.address);
  });

  describe('Test basic read operations', () => {
    it('should set token correctly information correctly', async () => {
      expect(await mystikoCoreSourceERC20.asset()).to.equal(testToken.address);
      expect(await mystikoCoreSourceERC20.assetName()).to.equal(await testToken.name());
      expect(await mystikoCoreSourceERC20.assetSymbol()).to.equal(await testToken.symbol());
      const actualDecimals = (await mystikoCoreSourceERC20.assetDecimals()).toString();
      const expectedDecimals = (await testToken.decimals()).toString();
      expect(actualDecimals).to.equal(expectedDecimals);

      const bridgeTypeSource = await mystikoCoreSourceERC20.bridgeType();
      const assetTypeSource = await mystikoCoreSourceERC20.assetType();
      expect(bridgeTypeSource).to.equal('anyswap');
      expect(assetTypeSource).to.equal('erc20');

      const bridgeTypeDestination = await mystikoCoreDestinationERC20.bridgeType();
      const assetTypeDestination = await mystikoCoreDestinationERC20.assetType();
      expect(bridgeTypeDestination).to.equal('anyswap');
      expect(assetTypeDestination).to.equal('erc20');
    });

    it('should set verifier information correctly', async () => {
      expect(await mystikoCoreSourceERC20.getVerifierAddress()).to.equal(verifier.address);
      expect(await mystikoCoreDestinationERC20.getVerifierAddress()).to.equal(verifier.address);
    });

    it('should set hasher information correctly', async () => {
      expect(await mystikoCoreSourceERC20.getHasherAddress()).to.equal(hasher.address);
      expect(await mystikoCoreDestinationERC20.getHasherAddress()).to.equal(hasher.address);
    });
  });

  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const skVerify = v1Protocol.secretKeyForVerification(rawSkVerify);
  const skEnc = v1Protocol.secretKeyForEncryption(rawSkEnc);
  const pkVerify = v1Protocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = v1Protocol.publicKeyForEncryption(rawSkEnc);
  let depositTx;

  describe('Test deposit operation', () => {
    it('should transfer token to account 1 correctly', async () => {
      const tokenContract = await TestToken.deployed();
      const initialBalanceOfAccount0 = await tokenContract.balanceOf(accounts[0]);
      await tokenContract.transfer(accounts[1], amount.toString(), { from: accounts[0] });
      const finalBalanceOfAccount0 = await tokenContract.balanceOf(accounts[0]);
      const differenceBalanceOfAccount0 = toBN(initialBalanceOfAccount0).sub(toBN(finalBalanceOfAccount0));
      expect(differenceBalanceOfAccount0.toString()).to.equal(amount.toString());
      const balanceOfAccount1 = await tokenContract.balanceOf(accounts[1]);
      expect(balanceOfAccount1.toString()).to.equal(amount.toString());

      await testToken.approve(mystikoCoreSourceERC20.address, amount.toString(), { from: accounts[1] });
      const allowance = await testToken.allowance(accounts[1], mystikoCoreSourceERC20.address);
      expect(allowance.toString()).to.equal(amount.toString());
    });

    it('should deposit successfully', async () => {
      const { commitmentHash, privateNote, k, randomS } = await v1Protocol.commitment(
        pkVerify,
        pkEnc,
        amount,
      );
      const initialBalanceOfAccount1 = await testToken.balanceOf(accounts[1]);

      const gasEstimated = await mystikoCoreSourceERC20.deposit.estimateGas(
        amount,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS, v1Protocol.RANDOM_SK_SIZE),
        toHex(privateNote),
        { from: accounts[1] },
      );

      depositTx = await mystikoCoreSourceERC20.deposit(
        amount,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS, v1Protocol.RANDOM_SK_SIZE),
        toHex(privateNote),
        {
          from: accounts[1],
          gas: gasEstimated,
        },
      );

      const finalBalanceOfAccount1 = await testToken.balanceOf(accounts[1]);
      const differenceBalanceOfAccount1 = toBN(initialBalanceOfAccount1).sub(toBN(finalBalanceOfAccount1));
      expect(differenceBalanceOfAccount1.toString()).to.equal(amount.toString());
      const depositEvent = depositTx.logs.find((e) => e['event'] === 'Deposit');
      expect(depositEvent).to.not.equal(undefined);
      expect(depositEvent.args.amount.toString()).to.equal(amount.toString());
      expect(depositEvent.args.commitmentHash).to.equal(toFixedLenHex(commitmentHash));
      expect(depositEvent.args.encryptedNote).to.equal(toHex(privateNote));
      const merkleTreeInsertEvent = depositTx.logs.find((e) => e['event'] === 'MerkleTreeInsert');
      expect(merkleTreeInsertEvent).to.not.equal(undefined);
      expect(merkleTreeInsertEvent.args.amount.toString()).to.equal(amount.toString());
      expect(merkleTreeInsertEvent.args.leaf).to.equal(toFixedLenHex(commitmentHash));
      expect(merkleTreeInsertEvent.args.leafIndex.eq(toBN(0))).to.equal(true);
      const levels = await mystikoCoreDestinationERC20.getLevels();
      const tree = new MerkleTree([toBN(toHexNoPrefix(merkleTreeInsertEvent.args.leaf), 16)], {
        maxLevels: parseInt(levels),
      });
      const root = toBN(tree.root());
      const isKnownRoot = await mystikoCoreDestinationERC20.isKnownRoot(toFixedLenHex(root));
      expect(isKnownRoot).to.equal(true);
    });
  });

  describe('Test withdraw operation', () => {
    let proof, publicSignals;
    it('should generate proof successfully', async () => {
      const depositEvent = depositTx.logs.find((e) => e['event'] === 'Deposit');
      const merkleTreeInsertEvent = depositTx.logs.find((e) => e['event'] === 'MerkleTreeInsert');
      const dAmount = toBN(depositEvent.args.amount.toString());
      const commitmentHash = toBN(toHexNoPrefix(depositEvent.args.commitmentHash), 16);
      const privateNote = toBuff(toHexNoPrefix(depositEvent.args.encryptedNote));
      const treeLeaves = [commitmentHash];
      const treeIndex = Number(merkleTreeInsertEvent.args.leafIndex);
      const fullProof = await v1Protocol.zkProveWithdraw(
        pkVerify,
        skVerify,
        pkEnc,
        skEnc,
        dAmount,
        accounts[2],
        commitmentHash,
        privateNote,
        treeLeaves,
        treeIndex,
        'node_modules/@mystikonetwork/circuits/dist/circom/dev/Withdraw.wasm.gz',
        'node_modules/@mystikonetwork/circuits/dist/circom/dev/Withdraw.zkey.gz',
      );
      proof = fullProof.proof;
      publicSignals = fullProof.publicSignals;
      expect(proof['pi_a'].length).to.be.gte(2);
      expect(proof['pi_b'].length).to.be.gte(2);
      expect(proof['pi_b'][0].length).to.equal(2);
      expect(proof['pi_b'][1].length).to.equal(2);
      expect(proof['pi_c'].length).to.be.gte(2);
      expect(publicSignals.length).to.equal(4);
      const result = await v1Protocol.zkVerify(
        proof,
        publicSignals,
        'node_modules/@mystikonetwork/circuits/dist/circom/dev/Withdraw.vkey.json.gz',
      );
      expect(result).to.equal(true);
    });

    it('should withdraw successfully', async () => {
      const recipient = accounts[2];
      await testToken.transfer(mystikoCoreDestinationERC20.address, amount.toString(), {
        from: accounts[0],
      });
      const proofA = [toBN(proof.pi_a[0]), toBN(proof.pi_a[1])];
      const proofB = [
        [toBN(proof.pi_b[0][1]), toBN(proof.pi_b[0][0])],
        [toBN(proof.pi_b[1][1]), toBN(proof.pi_b[1][0])],
      ];
      const proofC = [toBN(proof.pi_c[0]), toBN(proof.pi_c[1])];
      const rootHash = toBN(publicSignals[0]);
      const serialNumber = toBN(publicSignals[1]);
      const result = await verifier.verifyProof(proofA, proofB, proofC, [
        rootHash,
        serialNumber,
        amount,
        recipient,
      ]);
      expect(result).to.equal(true);
      const initialBalanceOfAccount2 = await testToken.balanceOf(accounts[2]);
      const gasEstimated = await mystikoCoreDestinationERC20.withdraw.estimateGas(
        proofA,
        proofB,
        proofC,
        rootHash,
        serialNumber,
        amount,
        recipient,
        { from: accounts[1] },
      );
      await mystikoCoreDestinationERC20.withdraw(
        proofA,
        proofB,
        proofC,
        rootHash,
        serialNumber,
        amount,
        recipient,
        {
          from: accounts[1],
          gas: gasEstimated,
        },
      );
      const finalBalanceOfAccount2 = await testToken.balanceOf(accounts[2]);
      const differenceBalanceOfAccount2 = toBN(finalBalanceOfAccount2).sub(toBN(initialBalanceOfAccount2));
      expect(differenceBalanceOfAccount2.toString()).to.equal(amount.toString());
      const isSpent = await mystikoCoreDestinationERC20.isSpent(serialNumber);
      expect(isSpent).to.equal(true);
    });
  });
});
