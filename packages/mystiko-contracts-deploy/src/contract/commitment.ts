import { CommitmentPoolMain__factory, CommitmentPoolERC20__factory } from '@mystikonetwork/contracts-abi';
import { ChainConfig } from '../config/chain';
import { ChainTokenConfig } from '../config/chainToken';
import { OperatorConfig } from '../config/operator';
import { ContractDeployConfig } from '../config/bridgeDeploy';
import { LOGRED, MerkleTreeHeight, RootHistoryLength } from '../common/constant';

let CommitmentPoolMain: CommitmentPoolMain__factory;
let CommitmentPoolERC20: CommitmentPoolERC20__factory;

let ethers: any;

export async function initPoolContractFactory(eth: any) {
  ethers = eth;
  CommitmentPoolMain = await ethers.getContractFactory('CommitmentPoolMain');
  CommitmentPoolERC20 = await ethers.getContractFactory('CommitmentPoolERC20');
}

export function getMystikoPoolContract(bErc20: string) {
  let coreContract: any;
  if (bErc20 === 'true') {
    coreContract = CommitmentPoolERC20;
  } else {
    coreContract = CommitmentPoolMain;
  }

  return coreContract;
}

async function deployCommitmentPool(
  commitmentPoolCfg: ContractDeployConfig,
  chainCfg: ChainConfig,
  chainTokenCfg: ChainTokenConfig,
) {
  let pool: any;
  const poolCfg = commitmentPoolCfg;
  if (chainTokenCfg.erc20) {
    console.log('deploy CommitmentPoolERC20');
    pool = await CommitmentPoolERC20.deploy(MerkleTreeHeight, RootHistoryLength, chainTokenCfg.address);
  } else {
    console.log('deploy CommitmentPoolMain');
    pool = await CommitmentPoolMain.deploy(MerkleTreeHeight, RootHistoryLength);
  }
  await pool.deployed();

  await pool.setMinRollupFee(chainTokenCfg.minRollupFee);
  await pool.enableRollupVerifier(1, chainCfg.rollup1Address);
  await pool.enableRollupVerifier(4, chainCfg.rollup4Address);
  await pool.enableRollupVerifier(16, chainCfg.rollup16Address);
  await pool.enableTransactVerifier(1, 0, chainCfg.transaction1x0VerifierAddress);
  await pool.enableTransactVerifier(1, 1, chainCfg.transaction1x1VerifierAddress);
  await pool.enableTransactVerifier(1, 2, chainCfg.transaction1x2VerifierAddress);
  await pool.enableTransactVerifier(2, 0, chainCfg.transaction2x0VerifierAddress);
  await pool.enableTransactVerifier(2, 1, chainCfg.transaction2x1VerifierAddress);
  await pool.enableTransactVerifier(2, 2, chainCfg.transaction2x2VerifierAddress);

  const syncStart = await ethers.provider.getBlockNumber();

  console.log('commitmentPool address is ', pool.address);
  poolCfg.address = pool.address;
  poolCfg.syncStart = syncStart;

  return pool.address;
}

export async function addRollupWhitelist(addr: string, rollers: string[]) {
  console.log('add roller whitelist');
  const pool = await CommitmentPoolMain.attach(addr);

  try {
    const all = [];
    for (let i = 0; i < rollers.length; i += 1) {
      const add = pool.addRollupWhitelist(rollers[i]);
      all.push(add);
    }
    await Promise.all(all);
  } catch (err: any) {
    console.error(LOGRED, err);
    process.exit(1);
  }
}

export async function addEnqueueWhitelist(addr: string, enqueueContractAddress: string) {
  const pool = await CommitmentPoolMain.attach(addr);
  console.log('add enqueue whitelist');
  try {
    await pool.addEnqueueWhitelist(enqueueContractAddress);
  } catch (err: any) {
    console.error(LOGRED, err);
    process.exit(1);
  }
}

export async function getOrDeployCommitPool(
  chainCfg: ChainConfig,
  chainTokenCfg: ChainTokenConfig,
  pairSrcPoolCfg: ContractDeployConfig,
  operatorCfg: OperatorConfig,
) {
  if (chainCfg.network === 'hardhat' || pairSrcPoolCfg.address === '') {
    console.log('commitment pool not exist, deploy');
    const commitmentPoolAddress = await deployCommitmentPool(pairSrcPoolCfg, chainCfg, chainTokenCfg);

    await addRollupWhitelist(commitmentPoolAddress, operatorCfg.rollers);
    return commitmentPoolAddress;
  }
  return pairSrcPoolCfg.address;
}
